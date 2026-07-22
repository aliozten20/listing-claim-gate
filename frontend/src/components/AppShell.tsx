"use client";

// AppShell is the client-side router for the SPA. It holds the active master
// view in state, syncs it to the URL hash (so views are shareable/back-button
// friendly) and swaps views in place with no full-page reload.

import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth";
import { AuthView } from "./views/AuthView";
import { GateView } from "./views/GateView";
import { DashboardView } from "./views/DashboardView";
import { PlaygroundView } from "./views/PlaygroundView";

export type MasterView = "gate" | "dashboard" | "playground";

const NAV: { id: MasterView; label: string; icon: string }[] = [
  { id: "gate", label: "Gate", icon: "◎" },
  { id: "dashboard", label: "Monitoring", icon: "▤" },
  { id: "playground", label: "LLM Lab", icon: "◑" },
];

export function AppShell() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState<MasterView>("gate");

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h === "gate" || h === "dashboard" || h === "playground") setView(h);
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
          loading session…
        </div>
      </div>
    );
  }

  if (!user) return <AuthView />;

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="flex items-center justify-between px-3 sm:px-5 h-14 border-b gap-2"
        style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
      >
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="grid place-items-center size-7 rounded-md font-bold text-sm"
              style={{ background: "var(--accent)", color: "#ecfdf5" }}
            >
              LG
            </span>
            <span className="font-semibold text-sm hidden sm:block truncate display">
              Listing Gate
            </span>
          </div>
          <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => go(n.id)}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                style={{
                  background:
                    view === n.id ? "var(--accent-soft)" : "transparent",
                  color: view === n.id ? "var(--text)" : "var(--text-dim)",
                }}
              >
                <span className="mr-1 opacity-70">{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        {view === "gate" ? (
          <GateView />
        ) : view === "dashboard" ? (
          <DashboardView />
        ) : (
          <PlaygroundView />
        )}
      </main>
    </div>
  );
}
