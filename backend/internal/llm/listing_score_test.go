// Listing score unit tests — commerce dimensions

package llm

import "testing"

func TestScoreListingCommerce_cleanListing(t *testing.T) {
	title := "Pamuklu Basic Tişört Erkek Regular Fit"
	desc := "Yumuşak pamuk karışımı. Materyal: %60 pamuk %40 polyester. " +
		"Beden tablosu ürün görselinde. Renk: lacivert. Yıkama: 30 derece. " +
		"İade ve değişim 14 gün içinde mağaza politikasına uygundur."
	sc := ScoreListingCommerce(title, desc, nil, DefaultListingWeights())
	if sc.Score < 70 {
		t.Fatalf("expected healthy listing score >= 70, got %.1f rationale=%s", sc.Score, sc.Rationale)
	}
	if sc.Breakdown.ClaimRisk < 70 {
		t.Fatalf("claim_risk too low: %.1f", sc.Breakdown.ClaimRisk)
	}
	if sc.Breakdown.TitleQuality < 60 {
		t.Fatalf("title_quality too low: %.1f", sc.Breakdown.TitleQuality)
	}
}

func TestScoreListingCommerce_absoluteClaims(t *testing.T) {
	title := "Klinik kanıtlı mucize krem"
	desc := "7 günde kesin sonuç. %100 etkili tedavi. İade yok."
	flags := []string{"risky_claims", "restrictive_return_policy"}
	sc := ScoreListingCommerce(title, desc, flags, DefaultListingWeights())
	if sc.Score >= 55 {
		t.Fatalf("expected low score for absolute claims, got %.1f", sc.Score)
	}
	if sc.Breakdown.ClaimRisk > 50 {
		t.Fatalf("claim_risk should be penalized, got %.1f", sc.Breakdown.ClaimRisk)
	}
	if sc.Breakdown.PolicyClarity > 40 {
		t.Fatalf("policy_clarity should be low, got %.1f", sc.Breakdown.PolicyClarity)
	}
}

func TestDecisionFromScore_thresholds(t *testing.T) {
	if DecisionFromScore(90, nil, DecisionPass) != DecisionPass {
		t.Fatal("expected PASS")
	}
	if DecisionFromScore(40, nil, DecisionPass) != DecisionReject {
		t.Fatal("expected REJECT")
	}
	if DecisionFromScore(70, nil, DecisionPass) != DecisionReview {
		t.Fatal("expected REVIEW")
	}
	if DecisionFromScore(99, []string{"missing_title"}, DecisionPass) != DecisionReject {
		t.Fatal("missing title must reject")
	}
}
