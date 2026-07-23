package confighandler

import (
	"net/http"

	"github.com/aliozten20/listing-claim-gate/backend/internal/shared/common"
	"github.com/aliozten20/listing-claim-gate/backend/internal/shared/config"
)

// Handler serves public application configuration and metadata.
type Handler struct {
	cfg config.Config
}

func NewHandler(cfg config.Config) *Handler { return &Handler{cfg: cfg} }

// Config returns non-secret settings the frontend needs to configure itself.
// GET /config  — never expose secrets (JWT secret, DB URL) here.
func (h *Handler) Config(w http.ResponseWriter, r *http.Request) {
	common.JSON(w, http.StatusOK, map[string]any{
		"app_name":    h.cfg.AppName,
		"version":     h.cfg.AppVersion,
		"environment": h.cfg.Env,
		"features": map[string]bool{
			"registration":     true,
			"decision_scoring": true,
			"listing_gate":     true,
			"mlc_attached":     h.cfg.MLCBaseURL != "",
			"mlc_proxy":        h.cfg.MLCBaseURL != "",
		},
		"mlc": map[string]any{
			"proxy_path": "/v1/mlc",
			"configured": h.cfg.MLCBaseURL != "",
			"note":       "Browser calls Render /v1/mlc/*; Render proxies to local worker tunnel (MLC_BASE_URL).",
		},
		"scoring": map[string]any{
			"type": "rule-based",
			"listing_dimensions": []string{
				"claim_risk", "title_quality", "desc_complete",
				"policy_clarity", "content_efficiency",
			},
			"llm_dimensions": []string{
				"completion", "latency", "efficiency", "keywords", "length",
			},
			"grades": []string{"A", "B", "C", "D", "F"},
		},
		"capacity": map[string]any{
			"max_concurrent_inferences": h.cfg.MaxConcurrentInferences,
		},
	})
}

// Version returns just the build/version info. GET /version
func (h *Handler) Version(w http.ResponseWriter, r *http.Request) {
	common.JSON(w, http.StatusOK, map[string]string{
		"name":    h.cfg.AppName,
		"version": h.cfg.AppVersion,
	})
}
