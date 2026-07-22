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

type I18nValue = {
  locale: Locale;
  t: Messages;
  setLocale: (l: Locale) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "en" || saved === "tr") setLocaleState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ locale, t: catalogs[locale], setLocale }),
    [locale, setLocale],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      className="inline-flex p-0.5 rounded-full text-xs font-bold"
      style={{ background: "var(--bg-elev)", border: "1px solid var(--border)" }}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        className="px-2 py-1 rounded-full"
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
        className="px-2 py-1 rounded-full"
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
