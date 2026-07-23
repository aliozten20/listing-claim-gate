// Package router wires the chi mux for Listing & Claim Gate.
// FE-compatible routes: /auth, /llm, /health, /metrics, /config, /ready, /docs.
// Worker MLC edge: authenticated /v1/mlc/* → MLC_BASE_URL (local tunnel).
package router

import (
	"context"
	"net/http"
	"time"

	"github.com/aliozten20/listing-claim-gate/backend/internal/infrastructure/http/handler/auth"
	confighandler "github.com/aliozten20/listing-claim-gate/backend/internal/infrastructure/http/handler/config"
	"github.com/aliozten20/listing-claim-gate/backend/internal/infrastructure/http/handler/docs"
	listinghandler "github.com/aliozten20/listing-claim-gate/backend/internal/infrastructure/http/handler/listing"
	"github.com/aliozten20/listing-claim-gate/backend/internal/infrastructure/mlc"
	"github.com/aliozten20/listing-claim-gate/backend/internal/shared/common"
	"github.com/aliozten20/listing-claim-gate/backend/internal/shared/config"
	"github.com/aliozten20/listing-claim-gate/backend/internal/shared/metrics"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Dependencies holds everything New needs to mount routes.
type Dependencies struct {
	Cfg         config.Config
	Pool        *pgxpool.Pool
	Auth        *auth.Handler
	Tokens      *auth.TokenService
	LLM         *listinghandler.Handler
	Config      *confighandler.Handler
	Metrics     *metrics.Registry
	AuthLimiter func(http.Handler) http.Handler
	Capacity    func(http.Handler) http.Handler
	MLC         mlc.Client
	MLCProxy    http.Handler
}

// New builds the root chi router with FE-compatible paths.
func New(deps Dependencies) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	if deps.Cfg.TrustProxy {
		r.Use(middleware.RealIP)
	}
	r.Use(common.RequestLogger)
	r.Use(common.Recover)
	r.Use(common.SecurityHeaders)
	r.Use(common.Timeout(deps.Cfg.RequestTimeout))
	r.Use(common.CORS(deps.Cfg.CORSOrigins))
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			deps.Metrics.IncHTTP()
			next.ServeHTTP(w, req)
		})
	})

	r.Get("/config", deps.Config.Config)
	r.Get("/version", deps.Config.Version)

	r.Get("/openapi.yaml", docs.SpecYAML)
	r.Get("/docs", docs.Reference)

	r.Get("/metrics", deps.Metrics.Handler())

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		common.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	r.Get("/ready", func(w http.ResponseWriter, req *http.Request) {
		pingCtx, cancel := context.WithTimeout(req.Context(), 2*time.Second)
		defer cancel()
		if err := deps.Pool.Ping(pingCtx); err != nil {
			common.Error(w, common.ErrInternal("database unavailable"))
			return
		}
		mlcConfigured := deps.Cfg.MLCBaseURL != ""
		mlcAttached := false
		if mlcConfigured && deps.MLC != nil {
			hctx, hcancel := context.WithTimeout(req.Context(), 2*time.Second)
			defer hcancel()
			mlcAttached = deps.MLC.Healthy(hctx) == nil
		}
		common.JSON(w, http.StatusOK, map[string]any{
			"status":         "ready",
			"mlc_configured": mlcConfigured,
			"mlc_attached":   mlcAttached,
			"redis":          "skipped",
			"kafka":          "skipped",
		})
	})

	r.Mount("/auth", deps.Auth.Routes(deps.Tokens.Verify, deps.AuthLimiter))
	r.Mount("/llm", deps.LLM.Routes(deps.Tokens.Verify, deps.Capacity))

	if deps.MLCProxy != nil {
		r.Group(func(pr chi.Router) {
			pr.Use(common.RequireAuth(deps.Tokens.Verify))
			pr.Handle("/v1/mlc", deps.MLCProxy)
			pr.Handle("/v1/mlc/*", deps.MLCProxy)
		})
	}

	return r
}
