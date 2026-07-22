"use client";

// EfficiencyPanel visualises throughput / density telemetry for a single run.
// Complements the Deci.Scoring "efficiency" bar with concrete tok/s insight.

import type { EfficiencyReport } from "@/lib/types";
import { useI18n } from "@/i18n/LocaleProvider";

export function EfficiencyPanel({ report }: { report: EfficiencyReport }) {
  const { t } = useI18n();
  const verdictLabel =
    report.verdict === "excellent"
      ? t.effExcellent
      : report.verdict === "good"
        ? t.effGood
        : report.verdict === "poor"
          ? t.effPoor
          : t.effFair;
  const color =
    report.verdict === "excellent"
      ? "var(--good)"
      : report.verdict === "good"
        ? "#a3e635"
        : report.verdict === "poor"
          ? "var(--bad)"
          : "var(--warn)";
  const soft = `color-mix(in srgb, ${color} 14%, transparent)`;

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{t.effTitle}</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
            {t.effSub}
          </p>
        </div>
        <span
          className="pill text-xs font-semibold"
          style={{ color, background: soft, borderColor: "transparent" }}
        >
          {verdictLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MiniStat
          label={t.effThroughput}
          value={fmt(report.tokens_per_sec, "tok/s")}
          hint={t.effHintTok}
        />
        <MiniStat
          label={t.effDensity}
          value={fmt(report.chars_per_token, "c/tok")}
          hint={t.effHintDensity}
        />
        <MiniStat
          label={t.effWriteSpeed}
          value={fmt(report.chars_per_sec, "ch/s")}
          hint={t.effHintWrite}
        />
        <MiniStat
          label={t.effOutIn}
          value={
            report.token_ratio > 0 ? `${report.token_ratio.toFixed(2)}×` : "—"
          }
          hint={t.effHintRatio}
        />
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: "var(--text-dim)" }}>{t.effDimLabel}</span>
          <span className="mono">{report.dimension_score.toFixed(0)} / 100</span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "var(--bg-elev-2)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, report.dimension_score)}%`,
              background: color,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px] mono">
        <Band label="tok/s" low="<8" mid="8–40" high="≥40" />
        <Band label="c/tok" low="<2" mid="2–4" high="≥4" />
        <Band label="latency" low={`≥${20}s`} mid="1.5–20s" high="≤1.5s" />
      </div>

      {report.insights.length > 0 && (
        <ul className="space-y-1.5">
          {report.insights.map((tip) => (
            <li
              key={tip}
              className="text-xs leading-5 flex gap-2"
              style={{ color: "var(--text-dim)" }}
            >
              <span style={{ color }}>▸</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div
      className="rounded-lg px-2.5 py-2"
      style={{ background: "var(--bg-elev-2)", border: "1px solid var(--border)" }}
      title={hint}
    >
      <div
        className="text-[10px] uppercase tracking-wide"
        style={{ color: "var(--text-faint)" }}
      >
        {label}
      </div>
      <div className="text-sm font-bold mono mt-0.5">{value}</div>
    </div>
  );
}

function Band({
  label,
  low,
  mid,
  high,
}: {
  label: string;
  low: string;
  mid: string;
  high: string;
}) {
  return (
    <div
      className="rounded-md px-2 py-1.5"
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
    >
      <div style={{ color: "var(--text-faint)" }}>{label}</div>
      <div className="mt-0.5" style={{ color: "var(--bad)" }}>
        {low}
      </div>
      <div style={{ color: "var(--warn)" }}>{mid}</div>
      <div style={{ color: "var(--good)" }}>{high}</div>
    </div>
  );
}

function fmt(n: number, unit: string): string {
  if (!n || n <= 0) return "—";
  const v = n >= 100 ? n.toFixed(0) : n.toFixed(1);
  return `${v} ${unit}`;
}
