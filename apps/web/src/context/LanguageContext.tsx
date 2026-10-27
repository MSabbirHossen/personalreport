import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Locale,
  Direction,
  translations,
  getNestedTranslation,
  interpolate,
  formatNumber as formatNumberUtil,
  formatDate as formatDateUtil,
  formatTime as formatTimeUtil,
  formatDuration as formatDurationUtil,
  formatMonthKey as formatMonthKeyUtil,
} from '../i18n/index.js';

export type { Locale, Direction };

export interface LanguageContextValue {
  locale: Locale;
  direction: Direction;
  setLocale: (locale: Locale) => void;
  isRTL: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatNumber: (value: number | string | null | undefined, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatDuration: (minutes: number | null | undefined) => string;
  formatMonthKey: (monthKey: string) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'bps-report-locale';
const LEGACY_STORAGE_KEY = 'report-bd-locale';

const isLocaleRTL = (loc: Locale): boolean => loc === 'ar';

function getStoredLocale(defaultLocale: Locale): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (stored === 'bn' || stored === 'en' || stored === 'ar') {
      return stored as Locale;
    }
  } catch {
    // Storage may be unavailable
  }
  return defaultLocale;
}

export const LanguageProvider: React.FC<React.PropsWithChildren<{ defaultLocale?: Locale }>> = ({
  children,
  defaultLocale = 'bn',
}) => {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale(defaultLocale));
  const direction: Direction = isLocaleRTL(locale) ? 'rtl' : 'ltr';

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = direction;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Storage might be blocked
    }
  }, [locale, direction]);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
  };

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>): string => {
      const activeDict = translations[locale] || translations.bn;
      const fallbackDict = translations.en;

      // 1. Try direct nested key path (e.g. 'dailyReport.title' or 'common.save')
      let result = getNestedTranslation(activeDict, key, fallbackDict);

      // 2. If returned keyPath, try legacy flat key prefixes: 'common.', 'nav.', 'auth.', etc.
      if (result === key && !key.includes('.')) {
        const candidatePrefixes = ['common', 'nav', 'auth', 'dashboard', 'dailyReport', 'profile'];
        for (const prefix of candidatePrefixes) {
          const candidate = getNestedTranslation(activeDict, `${prefix}.${key}`, fallbackDict);
          if (candidate !== `${prefix}.${key}`) {
            result = candidate;
            break;
          }
        }
      }

      return interpolate(result, params);
    };
  }, [locale]);

  const formatNumber = useMemo(() => {
    return (value: number | string | null | undefined, options?: Intl.NumberFormatOptions) =>
      formatNumberUtil(value, locale, options);
  }, [locale]);

  const formatDate = useMemo(() => {
    return (date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) =>
      formatDateUtil(date, locale, options);
  }, [locale]);

  const formatTime = useMemo(() => {
    return (date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) =>
      formatTimeUtil(date, locale, options);
  }, [locale]);

  const formatDuration = useMemo(() => {
    return (minutes: number | null | undefined) =>
      formatDurationUtil(minutes, locale);
  }, [locale]);

  const formatMonthKey = useMemo(() => {
    return (monthKey: string) =>
      formatMonthKeyUtil(monthKey, locale);
  }, [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      direction,
      setLocale,
      isRTL: direction === 'rtl',
      t,
      formatNumber,
      formatDate,
      formatTime,
      formatDuration,
      formatMonthKey,
    }),
    [locale, direction, t, formatNumber, formatDate, formatTime, formatDuration, formatMonthKey]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

/**
 * Standard hook alias for modern i18n usage across components.
 */
export function useTranslation() {
  return useLanguage();
}
