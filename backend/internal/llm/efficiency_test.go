package llm

import "testing"

func TestAnalyzeEfficiencyStrongThroughput(t *testing.T) {
	run := Run{
		Response:         "A concise answer about goroutines and channels.",
		LatencyMs:        500,
		PromptTokens:     20,
		CompletionTokens: 40, // 80 tok/s
	}
	got := AnalyzeEfficiency(run)
	if got.TokensPerSec < 70 {
		t.Fatalf("TokensPerSec = %v, want ~80", got.TokensPerSec)
	}
	if got.Verdict != "excellent" && got.Verdict != "good" {
		t.Fatalf("Verdict = %q, want excellent|good", got.Verdict)
	}
	if len(got.Insights) == 0 {
		t.Fatal("expected insights")
	}
}

func TestAnalyzeEfficiencySparseOutput(t *testing.T) {
	run := Run{
		Response:         "ok",
		LatencyMs:        5000,
		PromptTokens:     100,
		CompletionTokens: 50,
	}
	got := AnalyzeEfficiency(run)
	if got.CharsPerToken >= 2 {
		t.Fatalf("CharsPerToken = %v, want sparse (<2)", got.CharsPerToken)
	}
	if got.Verdict == "excellent" {
		t.Fatalf("Verdict = excellent for a sparse/slow run")
	}
}

func TestScoreRunIncludesEfficiencyAnalysis(t *testing.T) {
	got := ScoreRun(benchRun(), DefaultWeights())
	if got.EfficiencyAnalysis == nil {
		t.Fatal("EfficiencyAnalysis is nil")
	}
	if got.EfficiencyAnalysis.DimensionScore != got.Breakdown.Efficiency {
		t.Fatalf("DimensionScore = %v, want %v",
			got.EfficiencyAnalysis.DimensionScore, got.Breakdown.Efficiency)
	}
}
