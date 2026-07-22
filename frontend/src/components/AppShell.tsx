"use client";

// App shell — e-commerce SaaS: Auth · Gate · Decisions + language toggle.

import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth";
import { LanguageToggle, useI18n } from "@/i18n/LocaleProvider";
import { AuthView } from "./views/AuthView";
import { GateView } from "./views/GateView";
import { DashboardView } from "./views/DashboardView";

export type MasterView = "gate" | "monitoring";

export function AppShell() {
  const { user, loading, logout } = useAuth();
  const { t } = useI18n();
  const [view, setView] = useState<MasterView>("gate");

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h === "gate" || h === "monitoring" || h === "dashboard") {
        setView(h === "dashboard" ? "monitoring" : h);
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const go = (v: MasterView) => {
    setView(v);
    window.location.hash = v;
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div
          className="mono text-sm animate-pulse-soft"
          style={{ color: "var(--text-dim)" }}
        >
          {t.loading}
        </div>
      </div>
    );
  }

  if (!user) return <AuthView />;

  const nav: { id: MasterView; label: string }[] = [
    { id: "gate", label: t.navGate },
    { id: "monitoring", label: t.navDecisions },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="flex items-center justify-between px-3 sm:px-5 h-14 border-b gap-2"
        style={{ borderColor: "var(--border)", background: "var(--bg-elev-2)" }}
      >
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="grid place-items-center size-7 rounded-md font-bold text-sm"
              style={{ background: "var(--accent)", color: "#ecfdf5" }}
            >
              LG
            </span>
            <div className="hidden sm:block leading-tight">
              <div className="font-semibold text-sm display">{t.brand}</div>
              <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                {t.brandSub}
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {nav.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => go(n.id)}
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors"
                style={{
                  background:
                    view === n.id ? "var(--accent-soft)" : "transparent",
                  color: view === n.id ? "var(--accent)" : "var(--text-dim)",
                }}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <LanguageToggle />
          <span
            className="text-xs mono hidden md:block truncate max-w-[10rem]"
            style={{ color: "var(--text-faint)" }}
          >
            {user.email}
          </span>
          <button
            type="button"
            className="btn btn-ghost !py-1.5 !px-3"
            onClick={logout}
          >
            {t.signOut}
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        {view === "gate" ? <GateView /> : <DashboardView />}
      </main>
    </div>
  );
}
