"use client";

import { useState } from "react";
import type { Score } from "@/lib/types";
import { EfficiencyPanel } from "./EfficiencyPanel";
import { useI18n } from "@/i18n/LocaleProvider";
import type { Messages } from "@/i18n/messages";
import { formatRationale } from "@/i18n/format";

const COMMERCE_KEYS = [
  "claim_risk",
  "title_quality",
  "desc_complete",
  "policy_clarity",
  "content_efficiency",
] as const;

const LLM_KEYS = [
  "completion",
  "latency",
  "efficiency",
  "keywords",
  "length",
] as const;

function dimLabel(t: Messages, key: string): string {
  const map: Record<string, string> = {
    completion: t.dim_completion,
    latency: t.dim_latency,
    efficiency: t.dim_efficiency,
    keywords: t.dim_keywords,
    length: t.dim_length,
    claim_risk: t.dim_claim_risk,
    title_quality: t.dim_title_quality,
    desc_complete: t.dim_desc_complete,
    policy_clarity: t.dim_policy_clarity,
    content_efficiency: t.dim_content_efficiency,
  };
  return map[key] ?? key;
}

function dimInfo(t: Messages, key: string): string {
  const map: Record<string, string> = {
    completion: t.info_completion,
    latency: t.info_latency,
    efficiency: t.info_efficiency,
    keywords: t.info_keywords,
    length: t.info_length,
    claim_risk: t.info_claim_risk,
    title_quality: t.info_title_quality,
    desc_complete: t.info_desc_complete,
    policy_clarity: t.info_policy_clarity,
    content_efficiency: t.info_content_efficiency,
  };
  return map[key] ?? "";
}

function dimGood(t: Messages, key: string): string {
  const map: Record<string, string> = {
    completion: t.good_completion,
    latency: t.good_latency,
    efficiency: t.good_efficiency,
    keywords: t.good_keywords,
    length: t.good_length,
    claim_risk: t.good_claim_risk,
    title_quality: t.good_title_quality,
    desc_complete: t.good_desc_complete,
    policy_clarity: t.good_policy_clarity,
    content_efficiency: t.good_content_efficiency,
  };
  return map[key] ?? "";
}

function presentDims(breakdown: Score["breakdown"]): [string, number][] {
  const bd = breakdown as Record<string, number | undefined>;
  const commerce: [string, number][] = [];
  for (const k of COMMERCE_KEYS) {
    const v = bd[k];
    if (typeof v === "number" && !Number.isNaN(v)) commerce.push([k, v]);
  }
  if (commerce.length > 0) return commerce;
  const llm: [string, number][] = [];
  for (const k of LLM_KEYS) {
    const v = bd[k];
    if (typeof v === "number" && !Number.isNaN(v)) llm.push([k, v]);
  }
  return llm;
}

export function ScoreCard({ score }: { score: Score }) {
  const { t } = useI18n();
  const dims = presentDims(score.breakdown);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t.scoreTitle}</h2>
          <span className={`pill grade-${score.grade}`}>
            {t.scoreGrade} {score.grade}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div
            className="text-4xl font-bold mono"
            style={{ color: gradeColor(score.grade) }}
          >
            {score.score.toFixed(1)}
          </div>
          <div className="text-xs" style={{ color: "var(--text-dim)" }}>
            {t.scoreOutOf}
          </div>
        </div>

        <div className="space-y-2.5">
          {dims.map(([key, val]) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1 gap-2">
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{ color: "var(--text-dim)" }}
                >
                  {dimLabel(t, key)}
                  <button
                    type="button"
                    className="metric-info"
                    aria-label={t.scoreInfo}
                    aria-expanded={open === key}
                    onClick={() => setOpen((o) => (o === key ? null : key))}
                  >
                    i
                  </button>
                </span>
                <span className="mono">{val.toFixed(0)}</span>
              </div>
              {open === key && (
                <div className="metric-tip mb-1.5">
                  <p>
                    <strong>{t.scoreWhy}:</strong> {dimInfo(t, key)}
                  </p>
                  <p className="mt-1">
                    <strong>{t.scoreGoodRange}:</strong> {dimGood(t, key)}
                  </p>
                </div>
              )}
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--bg-elev-2)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${val}%`,
                    background:
                      key === "efficiency" || key === "content_efficiency"
                        ? "var(--accent)"
                        : barColor(val),
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
            {formatRationale(score.rationale, t)}
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
