package llm

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/aliozten/llm-monitoring/backend/internal/common"
	"github.com/go-chi/chi/v5"
)

// ListMockProducts returns the mock marketplace catalog.
// GET /llm/listings/mock/products
func (h *Handler) ListMockProducts(w http.ResponseWriter, r *http.Request) {
	products := MockProducts()
	common.JSON(w, http.StatusOK, map[string]any{
		"platform": "mock-trendyol",
		"count":    len(products),
		"products": products,
		"note":     "Stand-in feed until real marketplace credentials are connected.",
	})
}

// GetMockProduct returns one mock product by external id.
// GET /llm/listings/mock/products/{id}
func (h *Handler) GetMockProduct(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	p, ok := MockProductByID(id)
	if !ok {
		common.Error(w, common.ErrNotFound("mock product not found"))
		return
	}
	common.JSON(w, http.StatusOK, p)
}

// AnalyzeListing runs the Gate pipeline for manual or mock input, persists a
// raw llm_run, auto-scores with Deci.Scoring, and returns a publish decision.
// POST /llm/listings/analyze
func (h *Handler) AnalyzeListing(w http.ResponseWriter, r *http.Request) {
	claims, _ := common.ClaimsFromContext(r.Context())

	var req AnalyzeListingRequest
	if err := common.Decode(r, &req); err != nil {
		common.Error(w, err)
		return
	}

	source := strings.ToLower(strings.TrimSpace(req.Source))
	if source == "" {
		source = "manual"
	}

	var product CanonicalProduct
	switch source {
	case "mock":
		if strings.TrimSpace(req.ProductID) == "" {
			common.Error(w, common.ErrBadRequest("product_id is required for mock source"))
			return
		}
		p, ok := MockProductByID(req.ProductID)
		if !ok {
			common.Error(w, common.ErrNotFound("mock product not found"))
			return
		}
		product = p
		// Allow optional override of title/desc for experimentation.
		if t := strings.TrimSpace(req.Title); t != "" {
			product.Title = t
		}
		if d := strings.TrimSpace(req.Description); d != "" {
			product.DescriptionText = d
		}
	case "manual":
		title := strings.TrimSpace(req.Title)
		desc := strings.TrimSpace(req.Description)
		if title == "" && desc == "" {
			common.Error(w, common.ErrBadRequest("title or description is required"))
			return
		}
		platform := strings.TrimSpace(req.Platform)
		if platform == "" {
			platform = "manual"
		}
		product = CanonicalProduct{
			ExternalID:      "manual-" + time.Now().UTC().Format("20060102-150405"),
			Platform:        platform,
			ShopID:          "manual",
			SKU:             "",
			Title:           title,
			DescriptionText: desc,
			Locale:          "tr-TR",
			SyncedAt:        time.Now().UTC(),
		}
	default:
		common.Error(w, common.ErrBadRequest("source must be manual or mock"))
		return
	}

	response, keywords, flags, insights, provisional := AnalyzeListingText(
		product.Title, product.DescriptionText, req.Keywords,
	)
	latency := SimulatedLatencyMs()
	prompt := "Analyze marketplace listing for publish readiness.\nTitle: " + product.Title +
		"\nDescription: " + product.DescriptionText

	meta, _ := json.Marshal(map[string]any{
		"source":     source,
		"platform":   product.Platform,
		"product_id": product.ExternalID,
		"flags":      flags,
		"gate":       "listing-claim",
	})

	run, err := h.store.CreateRun(r.Context(), claims.UserID, CreateRunRequest{
		Model:            listingEngine,
		Prompt:           prompt,
		Response:         response,
		SystemPrompt:     "You are Listing & Claim Gate. Extract risks and quality signals.",
		PromptTokens:     estimateTokens(prompt),
		CompletionTokens: estimateTokens(response),
		LatencyMs:        latency,
		Temperature:      0,
		ExpectedKeywords: keywords,
		Metadata:         meta,
		AutoScore:        false,
	})
	if err != nil {
		common.Error(w, common.ErrInternal("could not save listing run"))
		return
	}

	score := ScoreListingCommerce(product.Title, product.DescriptionText, flags, DefaultListingWeights())
	score.RunID = run.ID
	saved, err := h.store.UpsertScore(r.Context(), score)
	if err != nil {
		common.Error(w, common.ErrInternal("could not save listing score"))
		return
	}
	saved.EfficiencyAnalysis = score.EfficiencyAnalysis

	decision := DecisionFromScore(saved.Score, flags, provisional)
	if h.onAnalyze != nil {
		h.onAnalyze(string(decision), latency)
	}

	common.JSON(w, http.StatusOK, AnalyzeListingResult{
		Product:    product,
		Decision:   decision,
		Flags:      flags,
		Insights:   insights,
		Engine:     listingEngine,
		RunID:      run.ID,
		Score:      &saved,
		AnalyzedAt: time.Now().UTC(),
	})
}

func estimateTokens(s string) int {
	n := utf8.RuneCountInString(s)
	if n == 0 {
		return 0
	}
	// Rough heuristic: ~4 chars per token for Latin/Turkish mix.
	t := n / 4
	if t < 1 {
		return 1
	}
	return t
}
