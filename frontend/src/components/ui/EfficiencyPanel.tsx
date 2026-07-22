"use client";

// EfficiencyPanel visualises throughput / density telemetry for a single run.
// Complements the Deci.Scoring "efficiency" bar with concrete tok/s insight.

import type { EfficiencyReport } from "@/lib/types";

const VERDICT_STYLE: Record<
  string,
  { label: string; color: string; soft: string }
> = {
  excellent: { label: "Excellent", color: "var(--good)", soft: "color-mix(in srgb, var(--good) 14%, transparent)" },
  good: { label: "Good", color: "#a3e635", soft: "color-mix(in srgb, #a3e635 14%, transparent)" },
  fair: { label: "Fair", color: "var(--warn)", soft: "color-mix(in srgb, var(--warn) 14%, transparent)" },
  poor: { label: "Poor", color: "var(--bad)", soft: "color-mix(in srgb, var(--bad) 14%, transparent)" },
};

export function EfficiencyPanel({ report }: { report: EfficiencyReport }) {
  const style = VERDICT_STYLE[report.verdict] ?? VERDICT_STYLE.fair;

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Model efficiency</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
            Throughput · density · token economy
          </p>
        </div>
        <span
          className="pill text-xs font-semibold"
          style={{ color: style.color, background: style.soft, borderColor: "transparent" }}
        >
          {style.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MiniStat
          label="Throughput"
          value={fmt(report.tokens_per_sec, "tok/s")}
          hint="completion tokens / sec"
        />
        <MiniStat
          label="Density"
          value={fmt(report.chars_per_token, "c/tok")}
          hint="chars per completion token"
        />
        <MiniStat
          label="Write speed"
          value={fmt(report.chars_per_sec, "ch/s")}
          hint="response chars / sec"
        />
        <MiniStat
          label="Out / in"
          value={
            report.token_ratio > 0 ? `${report.token_ratio.toFixed(2)}×` : "—"
          }
          hint="completion ÷ prompt tokens"
        />
      </div>

      {/* Efficiency dimension gauge */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: "var(--text-dim)" }}>Deci.Scoring · efficiency</span>
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
              background: style.color,
            }}
          />
        </div>
      </div>

      {/* Reference bands */}
      <div className="grid grid-cols-3 gap-2 text-[11px] mono">
        <Band label="tok/s" low="<8" mid="8–40" high="≥40" />
        <Band label="c/tok" low="<2" mid="2–4" high="≥4" />
        <Band
          label="latency"
          low={`≥${20}s`}
          mid="1.5–20s"
          high="≤1.5s"
        />
      </div>

      {report.insights.length > 0 && (
        <ul className="space-y-1.5">
          {report.insights.map((tip) => (
            <li
              key={tip}
              className="text-xs leading-5 flex gap-2"
              style={{ color: "var(--text-dim)" }}
            >
              <span style={{ color: style.color }}>▸</span>
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
      <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
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
