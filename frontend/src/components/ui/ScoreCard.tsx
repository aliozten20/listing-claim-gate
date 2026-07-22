"use client";

// Visualises a decision score: the headline number/grade plus the transparent
// per-dimension breakdown that the Go scorer returned. When efficiency analysis
// is present, EfficiencyPanel expands the throughput story beneath the bars.

import type { Score } from "@/lib/types";
import { EfficiencyPanel } from "./EfficiencyPanel";

const DIM_LABELS: Record<string, string> = {
  completion: "Completion",
  latency: "Latency",
  efficiency: "Efficiency",
  keywords: "Keywords",
  length: "Length",
};

const DIM_HINTS: Record<string, string> = {
  completion: "Did the model answer (not empty / not a refusal)?",
  latency: "Was the response fast enough?",
  efficiency: "Chars produced per completion token",
  keywords: "Coverage of expected keywords",
  length: "Answer neither too short nor excessively long",
};

export function ScoreCard({ score }: { score: Score }) {
  const dims = Object.entries(score.breakdown);
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Deci.Scoring</h2>
          <span className={`pill grade-${score.grade}`}>Grade {score.grade}</span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div
            className="text-4xl font-bold mono"
            style={{ color: gradeColor(score.grade) }}
          >
            {score.score.toFixed(1)}
          </div>
          <div className="text-xs" style={{ color: "var(--text-dim)" }}>
            out of 100 · rule-based · transparent breakdown
          </div>
        </div>

        <div className="space-y-2.5">
          {dims.map(([key, val]) => (
            <div key={key} title={DIM_HINTS[key]}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: "var(--text-dim)" }}>
                  {DIM_LABELS[key] ?? key}
                  {key === "efficiency" ? " ★" : ""}
                </span>
                <span className="mono">{val.toFixed(0)}</span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--bg-elev-2)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${val}%`,
                    background:
                      key === "efficiency" ? "var(--accent)" : barColor(val),
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {score.rationale && (
          <p
            className="text-xs mt-4 leading-5"
            style={{ color: "var(--text-dim)" }}
          >
            {score.rationale}
          </p>
        )}
      </div>

      {score.efficiency_analysis && (
        <EfficiencyPanel report={score.efficiency_analysis} />
      )}
    </div>
  );
}

function gradeColor(grade: string): string {
  return (
    { A: "var(--good)", B: "#a3e635", C: "var(--warn)", D: "#fb923c", F: "var(--bad)" }[
      grade
    ] ?? "var(--text)"
  );
}

function barColor(v: number): string {
  if (v >= 80) return "var(--good)";
  if (v >= 60) return "var(--warn)";
  return "var(--bad)";
}
