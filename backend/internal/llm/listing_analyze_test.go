package llm

import "testing"

func TestMockCatalogHasProducts(t *testing.T) {
	ps := MockProducts()
	if len(ps) < 5 {
		t.Fatalf("expected >=5 mock products, got %d", len(ps))
	}
	if _, ok := MockProductByID("mock-ty-001"); !ok {
		t.Fatal("mock-ty-001 missing")
	}
	if _, ok := MockProductByID("nope"); ok {
		t.Fatal("unexpected product")
	}
}

func TestAnalyzeListingRejectsEmpty(t *testing.T) {
	_, _, flags, _, decision := AnalyzeListingText("", "", nil)
	if decision != DecisionReject {
		t.Fatalf("decision=%s, want REJECT", decision)
	}
	if !containsFlag(flags, "missing_title") || !containsFlag(flags, "missing_description") {
		t.Fatalf("flags=%v", flags)
	}
}

func TestAnalyzeListingFlagsRiskyClaims(t *testing.T) {
	_, _, flags, insights, decision := AnalyzeListingText(
		"%100 Organik Yerli Sweatshirt En Ucuz",
		"Sertifikasız organik. İade yok.",
		nil,
	)
	if !containsFlag(flags, "risky_claims") {
		t.Fatalf("expected risky_claims, flags=%v", flags)
	}
	if decision != DecisionReview && decision != DecisionReject {
		t.Fatalf("decision=%s, want REVIEW|REJECT", decision)
	}
	if len(insights) == 0 {
		t.Fatal("expected insights")
	}
}

func TestDecisionFromScore(t *testing.T) {
	if DecisionFromScore(90, nil, DecisionPass) != DecisionPass {
		t.Fatal("want PASS")
	}
	if DecisionFromScore(70, []string{"risky_claims"}, DecisionReview) != DecisionReview {
		t.Fatal("want REVIEW")
	}
	if DecisionFromScore(90, []string{"missing_title"}, DecisionPass) != DecisionReject {
		t.Fatal("want REJECT for missing title")
	}
	if DecisionFromScore(40, nil, DecisionPass) != DecisionReject {
		t.Fatal("want REJECT for low score")
	}
}
