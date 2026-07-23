package listingapp

import "github.com/aliozten20/listing-claim-gate/backend/internal/domain/listing"

// Type aliases keep scoring/analyze code mechanical after the domain split.
type (
	Run                   = listing.Run
	RunSummary            = listing.RunSummary
	Score                 = listing.Score
	Breakdown             = listing.Breakdown
	Metadata              = listing.Metadata
	CreateRunRequest      = listing.CreateRunRequest
	ScoreRequest          = listing.ScoreRequest
	Metrics               = listing.Metrics
	ListResult            = listing.ListResult
	ModelInfo             = listing.ModelInfo
	CanonicalProduct      = listing.CanonicalProduct
	ProductAttr           = listing.ProductAttr
	AnalyzeListingRequest = listing.AnalyzeListingRequest
	ListingDecision       = listing.ListingDecision
	AnalyzeListingResult  = listing.AnalyzeListingResult
	EfficiencyReport      = listing.EfficiencyReport
	ModelEfficiency       = listing.ModelEfficiency
	Weights               = listing.Weights
)

const (
	DecisionPass   = listing.DecisionPass
	DecisionReview = listing.DecisionReview
	DecisionReject = listing.DecisionReject
)
