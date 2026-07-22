"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { AnalyzeListingResult, CanonicalProduct } from "@/lib/types";
import { ScoreCard } from "../ui/ScoreCard";
import { useI18n } from "@/i18n/LocaleProvider";

type Mode = "mock" | "manual";

export function GateView() {
  const { t, locale } = useI18n();
  const [mode, setMode] = useState<Mode>("mock");
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeListingResult | null>(null);

  const loadMock = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await api.mockProducts();
      setProducts(data.products);
      if (data.products.length > 0 && !selectedId) {
        setSelectedId(data.products[0].external_id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.gateLoadFail);
    } finally {
      setLoadingList(false);
    }
  }, [selectedId, t.gateLoadFail]);

  useEffect(() => {
    if (mode === "mock" && products.length === 0) {
      void loadMock();
    }
  }, [mode, products.length, loadMock]);

  useEffect(() => {
    if (mode !== "mock") return;
    const p = products.find((x) => x.external_id === selectedId);
    if (p) {
      setTitle(p.title);
      setDescription(p.description_text);
    }
  }, [mode, selectedId, products]);

  async function analyze() {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const kw = keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      const res =
        mode === "mock"
          ? await api.analyzeListing({
              source: "mock",
              product_id: selectedId,
              keywords: kw.length ? kw : undefined,
            })
          : await api.analyzeListing({
              source: "manual",
              title,
              description,
              keywords: kw.length ? kw : undefined,
            });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.gateAnalyzeFail);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t.gateTitle}</h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
            {t.gateSub}
          </p>
        </div>
        <div
          className="inline-flex p-1 rounded-lg self-start"
          style={{ background: "var(--bg-elev-2)" }}
        >
          {(
            [
              { id: "mock" as const, label: t.gateMock },
              { id: "manual" as const, label: t.gateManual },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id);
                setResult(null);
                setError(null);
              }}
              className="px-3 py-1.5 rounded-md text-sm font-semibold transition-colors"
              style={{
                background: mode === m.id ? "var(--accent)" : "transparent",
                color: mode === m.id ? "#ecfdf5" : "var(--text-dim)",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          className="card p-3 text-sm"
          style={{
            color: "var(--bad)",
            borderColor: "color-mix(in srgb, var(--bad) 35%, transparent)",
          }}
        >
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          {mode === "mock" ? (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">
                  {locale === "tr" ? "Mock Trendyol feed" : "Mock marketplace feed"}
                </h2>
                <button
                  type="button"
                  className="btn btn-ghost !py-1 !px-2.5 text-xs"
                  onClick={() => void loadMock()}
                  disabled={loadingList}
                >
                  {loadingList ? "…" : "↻"}
                </button>
              </div>
              <label className="label">{t.gateSelectProduct}</label>
              <select
                className="input"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={products.length === 0}
              >
                {products.map((p) => (
                  <option key={p.external_id} value={p.external_id}>
                    {p.title}
                  </option>
                ))}
              </select>
              {selectedId && (
                <div
                  className="rounded-lg p-3 text-xs space-y-1 max-h-40 overflow-y-auto scrollbar-thin"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="mono" style={{ color: "var(--text-faint)" }}>
                    {selectedId}
                  </div>
                  <div className="font-medium">{title}</div>
                  <div style={{ color: "var(--text-dim)" }}>{description}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-4 space-y-3">
              <h2 className="text-sm font-semibold">{t.gateManual}</h2>
              <div>
                <label className="label">{t.gateTitleLabel}</label>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Men navy cotton basic tee"
                />
              </div>
              <div>
                <label className="label">{t.gateDescLabel}</label>
                <textarea
                  className="input scrollbar-thin"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Material, fit, care…"
                />
              </div>
            </div>
          )}

          <div className="card p-4 space-y-3">
            <div>
              <label className="label">{t.gateKeywords}</label>
              <input
                className="input"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="cotton, size, care"
              />
            </div>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => void analyze()}
              disabled={
                analyzing ||
                (mode === "mock"
                  ? !selectedId
                  : !title.trim() && !description.trim())
              }
            >
              {analyzing ? t.gateAnalyzing : t.gateAnalyze}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {!result ? (
            <div
              className="card p-8 text-center text-sm"
              style={{ color: "var(--text-faint)" }}
            >
              {t.gateDecision}: PASS / REVIEW / REJECT
            </div>
          ) : (
            <>
              <DecisionBanner result={result} />
              {result.insights.length > 0 && (
                <div className="card p-4">
                  <h3 className="text-sm font-semibold mb-2">{t.gateInsights}</h3>
                  <ul className="space-y-1.5">
                    {result.insights.map((tip) => (
                      <li
                        key={tip}
                        className="text-xs leading-5 flex gap-2"
                        style={{ color: "var(--text-dim)" }}
                      >
                        <span style={{ color: "var(--accent)" }}>▸</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                  {result.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {result.flags.map((f) => (
                        <span
                          key={f}
                          className="pill mono"
                          style={{ color: "var(--warn)" }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {result.score && <ScoreCard score={result.score} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DecisionBanner({ result }: { result: AnalyzeListingResult }) {
  const { t } = useI18n();
  const style = decisionStyle(result.decision);
  return (
    <div
      className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      style={{ borderColor: style.border }}
    >
      <div>
        <div className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>
          {t.gateDecision} · {result.engine} · run {result.run_id.slice(0, 8)}…
        </div>
        <div className="text-2xl font-bold mono" style={{ color: style.color }}>
          {result.decision}
        </div>
        <div className="text-xs mt-1 truncate" style={{ color: "var(--text-dim)" }}>
          {result.product.title}
        </div>
      </div>
      <span
        className="pill self-start"
        style={{
          color: style.color,
          background: style.soft,
          borderColor: "transparent",
        }}
      >
        {style.label}
      </span>
    </div>
  );
}

function decisionStyle(d: string) {
  if (d === "PASS") {
    return {
      color: "var(--good)",
      soft: "color-mix(in srgb, var(--good) 14%, transparent)",
      border: "color-mix(in srgb, var(--good) 35%, transparent)",
      label: "PASS",
    };
  }
  if (d === "REJECT") {
    return {
      color: "var(--bad)",
      soft: "color-mix(in srgb, var(--bad) 14%, transparent)",
      border: "color-mix(in srgb, var(--bad) 35%, transparent)",
      label: "REJECT",
    };
  }
  return {
    color: "var(--warn)",
    soft: "color-mix(in srgb, var(--warn) 14%, transparent)",
    border: "color-mix(in srgb, var(--warn) 35%, transparent)",
    label: "REVIEW",
  };
}
