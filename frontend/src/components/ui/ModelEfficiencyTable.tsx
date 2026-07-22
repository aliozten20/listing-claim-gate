"use client";

// Per-model efficiency comparison table for the monitoring dashboard.

import type { ModelEfficiency } from "@/lib/types";
import { useI18n } from "@/i18n/LocaleProvider";

export function ModelEfficiencyTable({ rows }: { rows: ModelEfficiency[] }) {
  const { t } = useI18n();
  if (!rows.length) return null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">{t.modelEffTitle}</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
            {t.modelEffSub}
          </p>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ color: "var(--text-faint)" }}>
              <th className="text-left font-medium py-2 pr-3">{t.modelEffModel}</th>
              <th className="text-right font-medium py-2 px-2">{t.modelEffRuns}</th>
              <th className="text-right font-medium py-2 px-2">tok/s</th>
              <th className="text-right font-medium py-2 px-2">c/tok</th>
              <th className="text-right font-medium py-2 px-2">{t.modelEffLatency}</th>
              <th className="text-right font-medium py-2 px-2">{t.modelEffEff}</th>
              <th className="text-right font-medium py-2 pl-2">{t.modelEffScore}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.model}
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <td
                  className="py-2.5 pr-3 mono truncate max-w-[14rem]"
                  title={r.model}
                >
                  {shortModel(r.model)}
                </td>
                <td className="text-right mono px-2">{r.runs}</td>
                <td
                  className="text-right mono px-2"
                  style={{ color: tokColor(r.avg_tokens_per_sec) }}
                >
                  {r.avg_tokens_per_sec > 0
                    ? r.avg_tokens_per_sec.toFixed(1)
                    : "—"}
                </td>
                <td className="text-right mono px-2">
                  {r.avg_chars_per_token > 0
                    ? r.avg_chars_per_token.toFixed(1)
                    : "—"}
                </td>
                <td className="text-right mono px-2">
                  {Math.round(r.avg_latency_ms)}ms
                </td>
                <td
                  className="text-right mono px-2"
                  style={{ color: barColor(r.avg_efficiency) }}
                >
                  {r.avg_efficiency > 0 ? r.avg_efficiency.toFixed(0) : "—"}
                </td>
                <td
                  className="text-right mono pl-2"
                  style={{ color: "var(--accent)" }}
                >
                  {r.avg_score > 0 ? r.avg_score.toFixed(0) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function shortModel(id: string): string {
  return id
    .replace(/-MLC$/, "")
    .replace(/-Instruct/gi, "")
    .replace(/-it/gi, "");
}

function tokColor(v: number): string {
  if (v >= 40) return "var(--good)";
  if (v >= 8) return "var(--warn)";
  if (v > 0) return "var(--bad)";
  return "var(--text-faint)";
}

function barColor(v: number): string {
  if (v >= 80) return "var(--good)";
  if (v >= 60) return "var(--warn)";
  if (v > 0) return "var(--bad)";
  return "var(--text-faint)";
}
