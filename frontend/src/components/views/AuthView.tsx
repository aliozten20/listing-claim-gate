"use client";

// Master view: Auth. Contains two subviews — Login and Register — swapped
// client-side without navigation.

import { useState } from "react";
import { useAuth } from "@/store/auth";
import { ApiError } from "@/lib/api";

type SubView = "login" | "register";

export function AuthView() {
  const { login, register } = useAuth();
  const [sub, setSub] = useState<SubView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (sub === "login") await login(email, password);
      else await register(email, password, name);
      // On success the AppShell re-renders into the app automatically.
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof TypeError || (err instanceof Error && /fetch|network|Failed/i.test(err.message))) {
        setError(
          "API’ye ulaşılamıyor. Backend’in http://localhost:8080 üzerinde çalıştığından emin olun (docker compose up veya go run).",
        );
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand / pitch panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12"
        style={{
          background:
            "radial-gradient(900px 480px at 0% 0%, rgba(15,118,110,0.18) 0%, transparent 55%), linear-gradient(160deg, #dfe8ee 0%, #e8eef2 45%, #f4f7f9 100%)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="grid place-items-center w-9 h-9 rounded-lg font-bold"
            style={{ background: "var(--accent)", color: "#ecfdf5" }}
          >
            LG
          </span>
          <span className="font-semibold">Listing Gate</span>
        </div>
        <div className="max-w-md">
          <h1 className="display text-4xl font-bold leading-tight tracking-tight">
            Listing & Claim Gate
            <br />
            <span className="text-2xl font-semibold" style={{ color: "var(--text-dim)" }}>
              Deci.Scoring
            </span>
          </h1>
          <p className="mt-4 text-sm leading-6" style={{ color: "var(--text-dim)" }}>
            Mock mağaza veya manuel title/açıklama ile listing kalitesini ölçün.
            Yayın kararı: <strong>PASS</strong> / <strong>REVIEW</strong> /{" "}
            <strong>REJECT</strong> — şeffaf skor kırılımı ile.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Mock + Manuel", "Go + Postgres API", "A–F decision grades"].map(
              (t) => (
                <span key={t} className="pill" style={{ color: "var(--text-dim)" }}>
                  {t}
                </span>
              ),
            )}
          </div>
        </div>
        <div className="text-xs mono" style={{ color: "var(--text-faint)" }}>
          Next.js SPA → Vercel · Go → Render
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div
            className="inline-flex p-1 rounded-lg mb-6"
            style={{ background: "var(--bg-elev-2)" }}
          >
            {(["login", "register"] as SubView[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSub(s);
                  setError(null);
                }}
                className="px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-colors"
                style={{
                  background: sub === s ? "var(--accent)" : "transparent",
                  color: sub === s ? "#ecfdf5" : "var(--text-dim)",
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <h2 className="display text-2xl font-bold mb-1">
            {sub === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-dim)" }}>
            {sub === "login"
              ? "Sign in to score marketplace listings."
              : "Create an account to open Listing & Claim Gate."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {sub === "register" && (
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@masterfabric.co"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete={
                  sub === "login" ? "current-password" : "new-password"
                }
                minLength={8}
                required
              />
            </div>

            {error && (
              <div
                className="text-sm rounded-lg px-3 py-2"
                style={{
                  background: "color-mix(in srgb, var(--bad) 12%, transparent)",
                  color: "var(--bad)",
                  border:
                    "1px solid color-mix(in srgb, var(--bad) 30%, transparent)",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={busy}
            >
              {busy
                ? "Please wait…"
                : sub === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
