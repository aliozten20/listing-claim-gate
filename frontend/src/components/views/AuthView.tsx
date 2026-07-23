"use client";

import { useState } from "react";
import { useAuth } from "@/store/auth";
import { ApiError } from "@/lib/api";
import { LanguageToggle, useI18n } from "@/i18n/LocaleProvider";

type SubView = "login" | "register";

const PREVIEW_ROWS = [
  {
    title: "Organic cotton tee — soft everyday fit",
    decision: "PASS",
    score: 91,
    tone: "pass" as const,
  },
  {
    title: "Renews skin in 7 days — clinically proven",
    decision: "REJECT",
    score: 28,
    tone: "reject" as const,
  },
  {
    title: "Best price · limited stock",
    decision: "REVIEW",
    score: 64,
    tone: "review" as const,
  },
];

export function AuthView() {
  const { login, register } = useAuth();
  const { t } = useI18n();
  const [sub, setSub] = useState<SubView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (sub === "login") await login(email, password);
      else await register(email, password, name);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (
        err instanceof TypeError ||
        (err instanceof Error && /fetch|network|Failed/i.test(err.message))
      ) {
        setError(t.authApiDown);
      } else {
        setError(err instanceof Error ? err.message : t.authGenericError);
      }
    } finally {
      setBusy(false);
    }
  }

  function switchSub(next: SubView) {
    setSub(next);
    setError(null);
  }

  return (
    <div className="auth-root">
      <aside className="auth-brand">
        <div className="auth-brand-wash" />
        <div className="auth-orb auth-orb--a" aria-hidden />
        <div className="auth-orb auth-orb--b" aria-hidden />
        <div className="auth-brand-inner">
          <div className="auth-brand-top">
            <span className="auth-mark" aria-hidden>
              LG
            </span>
            <span className="auth-brand-name">{t.brand}</span>
            <div className="ml-auto">
              <LanguageToggle />
            </div>
          </div>

          <div className="auth-brand-hero">
            <p className="auth-eyebrow">{t.authEyebrow}</p>
            <h1 className="auth-display">
              {t.authDisplay1}
              <span className="auth-display-line">{t.authDisplay2}</span>
            </h1>
            <p className="auth-lede">{t.authLede}</p>
          </div>

          <div className="auth-preview" aria-hidden>
            {PREVIEW_ROWS.map((row, i) => (
              <div
                key={row.title}
                className={`auth-preview-row auth-preview-row--${row.tone}`}
                style={{ animationDelay: `${0.15 + i * 0.08}s` }}
              >
                <div className="auth-preview-meta">
                  <span className="auth-preview-title">{row.title}</span>
                  <span className={`auth-chip auth-chip--${row.tone}`}>
                    {row.decision}
                  </span>
                </div>
                <div className="auth-preview-bar">
                  <i style={{ width: `${row.score}%` }} />
                </div>
                <span className="auth-preview-score mono">{row.score}</span>
              </div>
            ))}
          </div>

          <p className="auth-brand-foot mono">{t.authFoot}</p>
        </div>
      </aside>

      <section className="auth-form-plane">
        <div className="auth-form-sheet auth-rise">
          <div className="auth-tabs" role="tablist" aria-label="Auth mode">
            <button
              type="button"
              role="tab"
              aria-selected={sub === "login"}
              className={sub === "login" ? "is-active" : undefined}
              onClick={() => switchSub("login")}
            >
              {t.authTabSignIn}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sub === "register"}
              className={sub === "register" ? "is-active" : undefined}
              onClick={() => switchSub("register")}
            >
              {t.authTabRegister}
            </button>
          </div>

          <header className="auth-form-head">
            <h2 className="display">
              {sub === "login" ? t.authWelcome : t.authOpen}
            </h2>
            <p>{sub === "login" ? t.authWelcomeSub : t.authOpenSub}</p>
          </header>

          <form onSubmit={submit} className="auth-fields" noValidate>
            {sub === "register" && (
              <label className="auth-field">
                <span>{t.authName}</span>
                <input
                  className="auth-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.authNamePh}
                  autoComplete="name"
                  required={sub === "register"}
                />
              </label>
            )}

            <label className="auth-field">
              <span>{t.authEmail}</span>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.authEmailPh}
                autoComplete="email"
                inputMode="email"
                required
              />
            </label>

            <label className="auth-field">
              <span className="auth-field-row">
                {t.authPassword}
                {sub === "login" && (
                  <span className="auth-hint">{t.authPwHint}</span>
                )}
              </span>
              <div className="auth-pw">
                <input
                  className="auth-input"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.authPwHint}
                  autoComplete={
                    sub === "login" ? "current-password" : "new-password"
                  }
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? t.authHide : t.authShow}
                >
                  {showPw ? t.authHide : t.authShow}
                </button>
              </div>
            </label>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy
                ? t.authWorking
                : sub === "login"
                  ? t.authSubmitLogin
                  : t.authSubmitRegister}
            </button>
          </form>

          <p className="auth-switch">
            {sub === "login" ? (
              <>
                {t.authNewShop}{" "}
                <button type="button" onClick={() => switchSub("register")}>
                  {t.authCreateLink}
                </button>
              </>
            ) : (
              <>
                {t.authHaveAccess}{" "}
                <button type="button" onClick={() => switchSub("login")}>
                  {t.authSignInLink}
                </button>
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
