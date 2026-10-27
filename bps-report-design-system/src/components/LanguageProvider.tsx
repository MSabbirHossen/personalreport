import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "bn" | "en" | "ar";
type LanguageContextValue = { locale: Locale; direction: "ltr" | "rtl"; setLocale: (locale: Locale) => void };
const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "report-bd-locale";
const isRTL = (locale: Locale) => locale === "ar";

export function LanguageProvider({ children, defaultLocale = "bn" }: React.PropsWithChildren<{ defaultLocale?: Locale }>) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return defaultLocale;
    try { return (window.localStorage.getItem(STORAGE_KEY) as Locale) || defaultLocale; } catch { return defaultLocale; }
  });
  const direction = isRTL(locale) ? "rtl" : "ltr";

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = direction;
    try { window.localStorage.setItem(STORAGE_KEY, locale); } catch { /* Storage may be blocked. */ }
  }, [locale, direction]);

  const value = useMemo(() => ({ locale, direction, setLocale }), [locale, direction]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}
