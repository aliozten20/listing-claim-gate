"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  catalogs,
  DEFAULT_LOCALE,
  type Locale,
  type Messages,
} from "./messages";

const STORAGE_KEY = "listing-gate-locale";
const SWITCH_MS = 700;

type I18nValue = {
  locale: Locale;
  t: Messages;
  setLocale: (l: Locale) => void;
  switching: boolean;
};

const I18nContext = createContext<I18nValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [switching, setSwitching] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "en" || saved === "tr") setLocaleState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback(
    (l: Locale) => {
      if (l === locale || switching) return;
      setPendingLocale(l);
      setSwitching(true);
      window.setTimeout(() => {
        setLocaleState(l);
        try {
          localStorage.setItem(STORAGE_KEY, l);
        } catch {
          /* ignore */
        }
        window.setTimeout(() => {
          setSwitching(false);
          setPendingLocale(null);
        }, 280);
      }, SWITCH_MS);
    },
    [locale, switching],
  );

  const value = useMemo(
    () => ({ locale, t: catalogs[locale], setLocale, switching }),
    [locale, setLocale, switching],
  );

  const switchLabel =
    catalogs[pendingLocale ?? locale].langSwitching;

  return (
    <I18nContext.Provider value={value}>
      {children}
      {switching && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            background: "color-mix(in srgb, var(--bg) 72%, transparent)",
            backdropFilter: "blur(6px)",
          }}
          role="status"
          aria-live="polite"
        >
          <div
            className="card px-6 py-5 flex flex-col items-center gap-3 min-w-[12rem]"
            style={{ boxShadow: "0 18px 50px rgba(0,0,0,.28)" }}
          >
            <div
              className="h-9 w-9 rounded-full border-2 animate-spin"
              style={{
                borderColor: "var(--accent)",
                borderTopColor: "transparent",
              }}
            />
            <p className="text-sm font-medium">{switchLabel}</p>
          </div>
        </div>
      )}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}

export function LanguageToggle() {
  const { locale, setLocale, t, switching } = useI18n();
  return (
    <div
      className="inline-flex p-0.5 rounded-full text-xs font-bold"
      style={{ background: "var(--bg-elev)", border: "1px solid var(--border)" }}
      role="group"
      aria-label={t.langAria}
    >
      <button
        type="button"
        className="px-2 py-1 rounded-full disabled:opacity-60"
        disabled={switching}
        style={{
          background: locale === "en" ? "var(--accent)" : "transparent",
          color: locale === "en" ? "#ecfdf5" : "var(--text-dim)",
        }}
        onClick={() => setLocale("en")}
      >
        {t.langEn}
      </button>
      <button
        type="button"
        className="px-2 py-1 rounded-full disabled:opacity-60"
        disabled={switching}
        style={{
          background: locale === "tr" ? "var(--accent)" : "transparent",
          color: locale === "tr" ? "#ecfdf5" : "var(--text-dim)",
        }}
        onClick={() => setLocale("tr")}
      >
        {t.langTr}
      </button>
    </div>
  );
}
