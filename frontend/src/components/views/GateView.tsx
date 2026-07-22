"use client";

// Gate master view: Mock marketplace fetch + Manual title/description analyze.

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { AnalyzeListingResult, CanonicalProduct } from "@/lib/types";
import { ScoreCard } from "../ui/ScoreCard";

type Mode = "mock" | "manual";

export function GateView() {
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
      setError(err instanceof ApiError ? err.message : "Mock ürünler yüklenemedi.");
    } finally {
      setLoadingList(false);
    }
  }, [selectedId]);

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
      setError(err instanceof ApiError ? err.message : "Analiz başarısız.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Listing & Claim Gate</h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
            Mock mağaza veya manuel title/açıklama → Deci.Scoring ile yayın kararı
            (engine: listing-rules-v1)
          </p>
        </div>
        <div
          className="inline-flex p-1 rounded-lg self-start"
          style={{ background: "var(--bg-elev-2)" }}
        >
          {([
            { id: "mock" as const, label: "Mock mağaza" },
            { id: "manual" as const, label: "Manuel" },
          ]).map((m) => (
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
        {/* Input */}
        <div className="space-y-4">
          {mode === "mock" ? (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Mock Trendyol feed</h2>
                <button
                  type="button"
                  className="btn btn-ghost !py-1 !px-2.5 text-xs"
                  onClick={() => void loadMock()}
                  disabled={loadingList}
                >
                  {loadingList ? "Yükleniyor…" : "↻ Yenile"}
                </button>
              </div>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                Gerçek API key yok — backend mock katalogdan çekiyor.
              </p>
              <label className="label">Ürün seç</label>
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
                  style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
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
              <h2 className="text-sm font-semibold">Manuel listing</h2>
              <div>
                <label className="label">Title</label>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn. Erkek Lacivert Pamuklu Basic Tişört"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input scrollbar-thin"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Materyal, kullanım, bakım…"
                />
              </div>
            </div>
          )}

          <div className="card p-4 space-y-3">
            <div>
              <label className="label">Expected keywords (opsiyonel, virgülle)</label>
              <input
                className="input"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="pamuk, beden, yıkama"
              />
            </div>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => void analyze()}
              disabled={
                analyzing ||
                (mode === "mock" ? !selectedId : !title.trim() && !description.trim())
              }
            >
              {analyzing ? "Analiz ediliyor…" : "Analiz et → Deci.Scoring"}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="space-y-4">
          {!result ? (
            <div
              className="card p-8 text-center text-sm"
              style={{ color: "var(--text-faint)" }}
            >
              Analiz sonucu burada görünür: PASS / REVIEW / REJECT + skor kırılımı.
            </div>
          ) : (
            <>
              <DecisionBanner result={result} />
              {result.insights.length > 0 && (
                <div className="card p-4">
                  <h3 className="text-sm font-semibold mb-2">Insights</h3>
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
                        <span key={f} className="pill mono" style={{ color: "var(--warn)" }}>
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
  const style = decisionStyle(result.decision);
  return (
    <div
      className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      style={{ borderColor: style.border }}
    >
      <div>
        <div className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>
          Yayın kararı · {result.engine} · run {result.run_id.slice(0, 8)}…
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
        style={{ color: style.color, background: style.soft, borderColor: "transparent" }}
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
      label: "Yayına uygun",
    };
  }
  if (d === "REJECT") {
    return {
      color: "var(--bad)",
      soft: "color-mix(in srgb, var(--bad) 14%, transparent)",
      border: "color-mix(in srgb, var(--bad) 35%, transparent)",
      label: "Reddet",
    };
  }
  return {
    color: "var(--warn)",
    soft: "color-mix(in srgb, var(--warn) 14%, transparent)",
    border: "color-mix(in srgb, var(--warn) 35%, transparent)",
    label: "İnsan incelemesi",
  };
}
