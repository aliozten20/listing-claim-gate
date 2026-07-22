package llm

import (
	"fmt"
	"strings"
	"unicode/utf8"
)

// ListingWeights for commerce Gate dimensions (sum ≈ 1.0).
type ListingWeights struct {
	ClaimRisk         float64
	TitleQuality      float64
	DescComplete      float64
	PolicyClarity     float64
	ContentEfficiency float64
}

func DefaultListingWeights() ListingWeights {
	return ListingWeights{
		ClaimRisk:         0.30,
		TitleQuality:      0.20,
		DescComplete:      0.25,
		PolicyClarity:     0.15,
		ContentEfficiency: 0.10,
	}
}

// Absolute / medical / miracle-claim markers (FTC-style substantiation risk).
var absoluteClaimMarkers = []string{
	"%100", "100%", "yüzde 100", "kesin sonuç", "garantili sonuç",
	"klinik kanıtlı", "klinik olarak kanıtlanmış", "tıbbi", "tedavi eder",
	"tedavi", "7 günde", "bir haftada", "mucize", "en iyi", "en ucuz",
	"rakipsiz", "sıfır risk", "side effect free", "fda approved",
}

var softClaimMarkers = []string{
	"organik", "doğal", "hakiki", "el yapımı", "su geçirmez",
	"yerli üretim", "premium", "profesyonel kalite",
}

// ScoreListingCommerce returns Deci-compatible Score with commerce breakdown
// fields populated (claim_risk, title_quality, …).
func ScoreListingCommerce(title, description string, flags []string, w ListingWeights) Score {
	title = strings.TrimSpace(title)
	desc := strings.TrimSpace(description)
	combined := strings.ToLower(title + " " + desc)
	titleLen := utf8.RuneCountInString(title)
	descLen := utf8.RuneCountInString(desc)

	claimRisk := scoreClaimRisk(combined, flags)
	titleQ := scoreTitleQuality(titleLen, flags)
	descC := scoreDescComplete(descLen, flags, combined)
	policy := scorePolicyClarity(combined, flags)
	contentEff := scoreContentEfficiency(titleLen, descLen, combined)

	bd := Breakdown{
		ClaimRisk:         round1(claimRisk),
		TitleQuality:      round1(titleQ),
		DescComplete:      round1(descC),
		PolicyClarity:     round1(policy),
		ContentEfficiency: round1(contentEff),
	}

	total := claimRisk*w.ClaimRisk +
		titleQ*w.TitleQuality +
		descC*w.DescComplete +
		policy*w.PolicyClarity +
		contentEff*w.ContentEfficiency
	total = clamp(total, 0, 100)

	return Score{
		Score:     round1(total),
		Grade:     grade(total),
		Breakdown: bd,
		Rationale: listingRationale(bd, flags),
	}
}

func scoreClaimRisk(combined string, flags []string) float64 {
	// Higher score = safer (fewer unsubstantiated claims).
	score := 100.0
	absHits := 0
	for _, m := range absoluteClaimMarkers {
		if strings.Contains(combined, m) {
			absHits++
		}
	}
	softHits := 0
	for _, m := range softClaimMarkers {
		if strings.Contains(combined, m) {
			softHits++
		}
	}
	score -= float64(absHits) * 22
	score -= float64(softHits) * 8
	if containsFlag(flags, "risky_claims") && absHits == 0 && softHits == 0 {
		score -= 15
	}
	return clamp(score, 0, 100)
}

func scoreTitleQuality(titleLen int, flags []string) float64 {
	if containsFlag(flags, "missing_title") || titleLen == 0 {
		return 0
	}
	// Marketplace practice: ~30–80 chars often perform; <12 weak, >120 noisy.
	switch {
	case titleLen < 12:
		return 35
	case titleLen < 25:
		return 65
	case titleLen <= 90:
		return 95
	case titleLen <= 120:
		return 75
	default:
		return 50
	}
}

func scoreDescComplete(descLen int, flags []string, combined string) float64 {
	if containsFlag(flags, "missing_description") || descLen == 0 {
		return 0
	}
	score := 40.0
	switch {
	case descLen < 40:
		score = 30
	case descLen < 120:
		score = 55
	case descLen < 400:
		score = 80
	case descLen <= 2500:
		score = 95
	default:
		score = 70
	}
	// Completeness signals used in e-com content QA.
	for _, tip := range []string{"materyal", "material", "beden", "size", "ölçü", "yıkama", "care", "renk", "color"} {
		if strings.Contains(combined, tip) {
			score = clamp(score+4, 0, 100)
		}
	}
	return score
}

func scorePolicyClarity(combined string, flags []string) float64 {
	score := 80.0
	if containsFlag(flags, "restrictive_return_policy") || strings.Contains(combined, "iade yok") {
		score = 25
	}
	if strings.Contains(combined, "iade") || strings.Contains(combined, "return") ||
		strings.Contains(combined, "garanti") || strings.Contains(combined, "warranty") {
		score = clamp(score+10, 0, 100)
	}
	return clamp(score, 0, 100)
}

func scoreContentEfficiency(titleLen, descLen int, combined string) float64 {
	if descLen == 0 {
		return 0
	}
	// Penalize keyword stuffing / repetition density (simple heuristic).
	words := strings.Fields(combined)
	if len(words) < 5 {
		return 45
	}
	uniq := map[string]struct{}{}
	for _, w := range words {
		uniq[w] = struct{}{}
	}
	ratio := float64(len(uniq)) / float64(len(words))
	score := ratio * 100
	// Very short desc relative to title = thin content.
	if descLen < titleLen {
		score *= 0.7
	}
	return clamp(score, 0, 100)
}

func listingRationale(bd Breakdown, flags []string) string {
	parts := []string{
		fmt.Sprintf("claim_risk=%.0f", bd.ClaimRisk),
		fmt.Sprintf("title_quality=%.0f", bd.TitleQuality),
		fmt.Sprintf("desc_complete=%.0f", bd.DescComplete),
		fmt.Sprintf("policy_clarity=%.0f", bd.PolicyClarity),
		fmt.Sprintf("content_efficiency=%.0f", bd.ContentEfficiency),
	}
	if len(flags) > 0 {
		parts = append(parts, "flags="+strings.Join(flags, ","))
	}
	return "Listing Gate commerce score: " + strings.Join(parts, "; ")
}
