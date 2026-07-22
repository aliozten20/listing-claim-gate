package llm

import "time"

// CanonicalProduct is the platform-agnostic listing shape used by Gate analyze.
type CanonicalProduct struct {
	ExternalID      string            `json:"external_id"`
	Platform        string            `json:"platform"`
	ShopID          string            `json:"shop_id"`
	SKU             string            `json:"sku"`
	Title           string            `json:"title"`
	DescriptionText string            `json:"description_text"`
	Brand           string            `json:"brand,omitempty"`
	CategoryPath    []string          `json:"category_path,omitempty"`
	Attributes      []ProductAttr     `json:"attributes,omitempty"`
	ClaimsHint      []string          `json:"claims_hint,omitempty"`
	Locale          string            `json:"locale"`
	SyncedAt        time.Time         `json:"synced_at"`
}

// ProductAttr is a key/value attribute on a canonical product.
type ProductAttr struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// AnalyzeListingRequest is posted by Gate (manual or mock).
type AnalyzeListingRequest struct {
	Source      string   `json:"source"` // manual | mock
	ProductID   string   `json:"product_id,omitempty"`
	Title       string   `json:"title,omitempty"`
	Description string   `json:"description,omitempty"`
	Platform    string   `json:"platform,omitempty"`
	Keywords    []string `json:"keywords,omitempty"`
}

// ListingDecision is the publish gate outcome.
type ListingDecision string

const (
	DecisionPass   ListingDecision = "PASS"
	DecisionReview ListingDecision = "REVIEW"
	DecisionReject ListingDecision = "REJECT"
)

// AnalyzeListingResult is what Gate renders after scoring.
type AnalyzeListingResult struct {
	Product      CanonicalProduct `json:"product"`
	Decision     ListingDecision  `json:"decision"`
	Flags        []string         `json:"flags"`
	Insights     []string         `json:"insights"`
	Engine       string           `json:"engine"` // listing-rules-v1 until MLC is wired
	RunID        string           `json:"run_id"`
	Score        *Score           `json:"score,omitempty"`
	AnalyzedAt   time.Time        `json:"analyzed_at"`
}
