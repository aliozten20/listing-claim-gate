// Command server is the entrypoint for the Listing & Claim Gate backend.
// It wires configuration, the database, middleware and the module routers,
// then serves HTTP with graceful shutdown.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/aliozten20/listing-claim-gate/backend/internal/infrastructure/http/handler/auth"
	confighandler "github.com/aliozten20/listing-claim-gate/backend/internal/infrastructure/http/handler/config"
	listinghandler "github.com/aliozten20/listing-claim-gate/backend/internal/infrastructure/http/handler/listing"
	"github.com/aliozten20/listing-claim-gate/backend/internal/infrastructure/http/router"
	"github.com/aliozten20/listing-claim-gate/backend/internal/infrastructure/mlc"
	"github.com/aliozten20/listing-claim-gate/backend/internal/infrastructure/postgres"
	"github.com/aliozten20/listing-claim-gate/backend/internal/shared/common"
	"github.com/aliozten20/listing-claim-gate/backend/internal/shared/config"
	"github.com/aliozten20/listing-claim-gate/backend/internal/shared/metrics"
	"github.com/aliozten20/listing-claim-gate/backend/migrations"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env for local development (ignored if the file is absent, e.g. on
	// Render where real environment variables are provided).
	_ = godotenv.Load()

	cfg := config.Load()

	// Structured logging: JSON in production (parseable by Render/aggregators),
	// human-readable text locally.
	common.SetupLogger(cfg.IsProduction())

	// Refuse to serve on a configuration that cannot be secure. This runs before
	// anything binds a port or opens a connection, so a misconfigured deploy
	// fails its health check loudly instead of quietly accepting forged tokens.
	if err := cfg.Validate(); err != nil {
		slog.Error("refusing to start", "error", err)
		os.Exit(1)
	}
	for _, w := range cfg.Warnings() {
		slog.Warn("configuration warning", "detail", w)
	}

	ctx := context.Background()
	pool, err := common.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	// Apply the idempotent schema on boot. The SQL is embedded in the binary
	// (see package migrations), so this works regardless of working directory.
	statements, err := migrations.SQL()
	if err != nil {
		slog.Error("load migrations failed", "error", err)
		os.Exit(1)
	}
	if err := common.RunMigrations(ctx, pool, statements...); err != nil {
		slog.Error("migrations failed", "error", err)
		os.Exit(1)
	}
	slog.Info("database ready, migrations applied")

	// ---- dependency wiring (constructor injection) ----
	tokens := auth.NewTokenService(cfg.JWTSecret, cfg.AccessTokenTTL, cfg.RefreshTokenTTL)
	authStore := postgres.NewAuthStore(pool)
	authHandler := auth.NewHandler(authStore, tokens, cfg.BcryptCost)

	llmStore := postgres.NewListingStore(pool)
	llmHandler := listinghandler.NewHandler(llmStore)

	reg := metrics.New(cfg.MaxConcurrentInferences)
	llmHandler.SetAnalyzeHook(reg.ObserveAnalyze)

	capacity := common.NewCapacityLimiter(
		cfg.MaxConcurrentInferences,
		reg.IncCapacityReject,
		reg.SetActiveSlots,
	)

	cfgHandler := confighandler.NewHandler(cfg)

	mlcClient := mlc.NewClient(cfg.MLCBaseURL)
	mlcProxy := mlc.NewProxyHandler(cfg.MLCBaseURL)
	llmHandler.SetMLC(mlcClient)

	// Background workers share one context so shutdown stops all of them.
	workerCtx, stopWorker := context.WithCancel(context.Background())
	defer stopWorker()

	// Per-IP rate limiter for sensitive auth endpoints: a burst of 10 then a
	// steady 1 request every 2s. Enough for real logins, hostile to brute force.
	authLimiter := common.NewRateLimiter(workerCtx, 0.5, 10)

	handler := router.New(router.Dependencies{
		Cfg:         cfg,
		Pool:        pool,
		Auth:        authHandler,
		Tokens:      tokens,
		LLM:         llmHandler,
		Config:      cfgHandler,
		Metrics:     reg,
		AuthLimiter: authLimiter.Middleware,
		Capacity:    capacity.Middleware,
		MLC:         mlcClient,
		MLCProxy:    mlcProxy,
	})

	if cfg.MLCBaseURL != "" {
		slog.Info("MLC worker edge configured", "url", cfg.MLCBaseURL, "proxy", "/v1/mlc/*")
	} else {
		slog.Info("MLC_BASE_URL unset — Gate uses listing-rules; set tunnel URL to attach worker MLC")
	}

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: handler,
		// Every phase of a connection needs a bound. ReadHeaderTimeout alone
		// leaves body reads and response writes unbounded, so a client that
		// stalls mid-transfer pins a goroutine and its database connection
		// indefinitely. WriteTimeout is deliberately wider than the per-request
		// timeout above, so handlers get to finish writing their error response
		// rather than having the connection cut from under them.
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	// ---- background: periodically reap expired/revoked sessions ----
	go sessionCleanup(workerCtx, authStore)

	// ---- serve with graceful shutdown ----
	go func() {
		slog.Info("server listening", "app", cfg.AppName, "port", cfg.Port, "env", cfg.Env)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	slog.Info("shutting down")

	stopWorker()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("graceful shutdown failed", "error", err)
	}
	slog.Info("stopped")
}

// sessionCleanup deletes expired and long-revoked sessions on a fixed interval
// (and once at startup) so the sessions table doesn't grow without bound. It
// exits promptly when its context is cancelled during shutdown.
func sessionCleanup(ctx context.Context, store *postgres.AuthStore) {
	const interval = time.Hour

	reap := func() {
		reapCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		defer cancel()
		n, err := store.DeleteExpiredSessions(reapCtx)
		if err != nil {
			slog.Warn("session cleanup failed", "error", err)
			return
		}
		if n > 0 {
			slog.Info("session cleanup", "deleted", n)
		}
	}

	reap() // run once at boot
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			reap()
		}
	}
}
