package llm

import (
	"fmt"
	"math"
)

// EfficiencyReport is a transparent throughput / cost-of-answer analysis for a
 // single run. It complements the Deci.Scoring "efficiency" dimension with
 // concrete telemetry the UI can chart (tok/s, chars/token, insights).
type EfficiencyReport struct {
	TokensPerSec   float64  `json:"tokens_per_sec"`
	CharsPerToken  float64  `json:"chars_per_token"`
	CharsPerSec    float64  `json:"chars_per_sec"`
	TotalTokens    int      `json:"total_tokens"`
	TokenRatio     float64  `json:"token_ratio"` // completion / max(prompt,1)
	LatencyMs      int      `json:"latency_ms"`
	PromptTokens   int      `json:"prompt_tokens"`
	CompletionTk   int      `json:"completion_tokens"`
	ResponseChars  int      `json:"response_chars"`
	DimensionScore float64  `json:"dimension_score"` // same 0..100 as breakdown.efficiency
	Verdict        string   `json:"verdict"`         // excellent|good|fair|poor
	Insights       []string `json:"insights"`
}

// ModelEfficiency is the per-model rollup shown on the monitoring dashboard.
type ModelEfficiency struct {
	Model            string  `json:"model"`
	Runs             int     `json:"runs"`
	AvgLatencyMs     float64 `json:"avg_latency_ms"`
	AvgTokensPerSec  float64 `json:"avg_tokens_per_sec"`
	AvgCharsPerToken float64 `json:"avg_chars_per_token"`
	AvgScore         float64 `json:"avg_score"`
	AvgEfficiency    float64 `json:"avg_efficiency"`
}

// AnalyzeEfficiency derives throughput metrics and human-readable insights
 // from a raw run. Safe to call with incomplete token accounting.
func AnalyzeEfficiency(run Run) EfficiencyReport {
	trimmed := len([]rune(run.Response)) // rune count ≈ visible characters
	if trimmed == 0 {
		trimmed = len(run.Response)
	}
	total := run.PromptTokens + run.CompletionTokens

	rep := EfficiencyReport{
		LatencyMs:     run.LatencyMs,
		PromptTokens:  run.PromptTokens,
		CompletionTk:  run.CompletionTokens,
		ResponseChars: trimmed,
		TotalTokens:   total,
		Insights:      make([]string, 0, 4),
	}

	if run.LatencyMs > 0 && run.CompletionTokens > 0 {
		rep.TokensPerSec = round2(float64(run.CompletionTokens) / (float64(run.LatencyMs) / 1000.0))
	}
	if run.CompletionTokens > 0 && trimmed > 0 {
		rep.CharsPerToken = round2(float64(trimmed) / float64(run.CompletionTokens))
	}
	if run.LatencyMs > 0 && trimmed > 0 {
		rep.CharsPerSec = round2(float64(trimmed) / (float64(run.LatencyMs) / 1000.0))
	}
	if run.PromptTokens > 0 {
		rep.TokenRatio = round2(float64(run.CompletionTokens) / float64(run.PromptTokens))
	}

	rep.DimensionScore = round1(scoreEfficiency(run.CompletionTokens, run.Response))
	rep.Verdict = efficiencyVerdict(rep)
	rep.Insights = efficiencyInsights(rep)
	return rep
}

func efficiencyVerdict(r EfficiencyReport) string {
	// Prefer tok/s when available; fall back to the Deci.Scoring dimension.
	switch {
	case r.TokensPerSec >= 40 && r.CharsPerToken >= 3.0:
		return "excellent"
	case r.TokensPerSec >= 20 || r.DimensionScore >= 80:
		return "good"
	case r.TokensPerSec >= 8 || r.DimensionScore >= 55:
		return "fair"
	default:
		return "poor"
	}
}

func efficiencyInsights(r EfficiencyReport) []string {
	out := make([]string, 0, 4)

	switch {
	case r.CompletionTk == 0:
		out = append(out, "No completion tokens reported — WebLLM may not have returned usage.")
	case r.TokensPerSec >= 40:
		out = append(out, fmt.Sprintf("Strong throughput at %.1f tok/s.", r.TokensPerSec))
	case r.TokensPerSec >= 20:
		out = append(out, fmt.Sprintf("Solid throughput at %.1f tok/s for an on-device model.", r.TokensPerSec))
	case r.TokensPerSec > 0 && r.TokensPerSec < 8:
		out = append(out, fmt.Sprintf("Low throughput (%.1f tok/s) — GPU contention or a heavy model quant.", r.TokensPerSec))
	}

	switch {
	case r.CharsPerToken >= 4.0:
		out = append(out, fmt.Sprintf("Dense output: %.1f chars/token — little token waste.", r.CharsPerToken))
	case r.CharsPerToken > 0 && r.CharsPerToken < 2.0:
		out = append(out, fmt.Sprintf("Sparse output: %.1f chars/token — many tokens for little text.", r.CharsPerToken))
	case r.CharsPerToken >= 2.0 && r.CharsPerToken < 3.0:
		out = append(out, fmt.Sprintf("Moderate density (%.1f chars/token).", r.CharsPerToken))
	}

	if r.LatencyMs >= badLatencyMs {
		out = append(out, fmt.Sprintf("Latency %dms is above the soft ceiling (%dms).", r.LatencyMs, badLatencyMs))
	} else if r.LatencyMs > 0 && r.LatencyMs <= goodLatencyMs {
		out = append(out, fmt.Sprintf("Latency %dms is within the fast band (≤%dms).", r.LatencyMs, goodLatencyMs))
	}

	if r.TokenRatio > 8 {
		out = append(out, fmt.Sprintf("Completion is %.0fx the prompt — long answers cost more GPU time.", r.TokenRatio))
	} else if r.PromptTokens > 0 && r.CompletionTk > 0 && r.TokenRatio < 0.25 {
		out = append(out, "Very short completion relative to the prompt — check for refusals or truncation.")
	}

	if len(out) == 0 {
		out = append(out, "Not enough telemetry yet to judge efficiency.")
	}
	return out
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
