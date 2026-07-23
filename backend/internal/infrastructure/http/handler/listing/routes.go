package listinghandler

import (
	"net/http"

	"github.com/aliozten20/listing-claim-gate/backend/internal/shared/common"
	"github.com/go-chi/chi/v5"
)

// Routes mounts the LLM endpoints. /models is public; everything else requires
// a valid access token. capacity wraps inference-heavy routes (20-slot killer).
func (h *Handler) Routes(verify common.TokenVerifier, capacity func(http.Handler) http.Handler) http.Handler {
	r := chi.NewRouter()

	r.Get("/models", h.Models)

	r.Group(func(pr chi.Router) {
		pr.Use(common.RequireAuth(verify))
		pr.Post("/runs", h.CreateRun)
		pr.Get("/runs", h.ListRuns)
		pr.Get("/runs/{id}", h.GetRun)
		pr.Delete("/runs/{id}", h.DeleteRun)
		pr.Post("/runs/{id}/score", h.ScoreRun)
		pr.Get("/runs/{id}/score", h.GetScore)
		pr.Get("/metrics", h.Metrics)

		pr.Get("/listings/mock/products", h.ListMockProducts)
		pr.Get("/listings/mock/products/{id}", h.GetMockProduct)

		if capacity != nil {
			pr.With(capacity).Post("/listings/analyze", h.AnalyzeListing)
		} else {
			pr.Post("/listings/analyze", h.AnalyzeListing)
		}
	})

	return r
}
