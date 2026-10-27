import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'bn' | 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

interface LanguageContextValue {
  locale: Locale;
  direction: Direction;
  setLocale: (locale: Locale) => void;
  isRTL: boolean;
  t: (key: string) => string;
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
      return stored;
    }
  } catch {
    // Storage may be unavailable
  }
  return defaultLocale;
}

// Common UI micro-copy dictionary for navigation and shell elements
const translations: Record<Locale, Record<string, string>> = {
  bn: {
    appTitle: 'BPS Report',
    tagline: 'Better Data · Brighter Future',
    dashboard: 'ড্যাশবোর্ড',
    dailyReport: 'দৈনিক রিপোর্ট',
    monthlyPlan: 'মাসিক পরিকল্পনা',
    monthlyOutcome: 'মাসিক ফলাফল',
    advice: 'পরামর্শ ও মন্তব্য',
    notifications: 'বিজ্ঞপ্তি',
    profile: 'প্রোফাইল',
    supervisorQueue: 'রিপোর্ট পর্যালোচনা কিউ',
    auditLog: 'অডিট ও নিরাপত্তা লগ',
    loading: 'আপনার রিপোর্ট প্রস্তুত করা হচ্ছে…',
    save: 'সংরক্ষণ করুন',
    saving: 'সংরক্ষণ হচ্ছে...',
    saved: 'সফলভাবে সংরক্ষিত',
    themeLight: 'লাইট মোড',
    themeDark: 'ডার্ক মোড',
    themeSystem: 'সিস্টেম মোড',
    logout: 'লগআউট',
  },
  en: {
    appTitle: 'BPS Report',
    tagline: 'Better Data · Brighter Future',
    dashboard: 'Dashboard',
    dailyReport: 'Daily Report',
    monthlyPlan: 'Monthly Plan',
    monthlyOutcome: 'Monthly Outcome',
    advice: 'Advice & Feedback',
    notifications: 'Notifications',
    profile: 'Profile',
    supervisorQueue: 'Supervisor Review Queue',
    auditLog: 'Audit & Security Logs',
    loading: 'Preparing your reports…',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved successfully',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    themeSystem: 'System Default',
    logout: 'Logout',
  },
  ar: {
    appTitle: 'تقرير BPS',
    tagline: 'بيانات أفضل · مستقبل أكثر إشراقاً',
    dashboard: 'لوحة التحكم',
    dailyReport: 'التقرير اليومي',
    monthlyPlan: 'الخطة الشهرية',
    monthlyOutcome: 'النتائج الشهرية',
    advice: 'النصائح والملاحظات',
    notifications: 'الإشعارات',
    profile: 'الملف الشخصي',
    supervisorQueue: 'قائمة مراجعة المشرف',
    auditLog: 'سجل التدقيق والأمان',
    loading: 'جارٍ تجهيز تقاريرك…',
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
    saved: 'تم الحفظ بنجاح',
    themeLight: 'الوضع الفاتح',
    themeDark: 'الوضع الداكن',
    themeSystem: 'تفضيل النظام',
    logout: 'تسجيل الخروج',
  },
};

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

  const t = (key: string): string => {
    return translations[locale]?.[key] || translations['bn']?.[key] || key;
  };

  const value = useMemo(
    () => ({
      locale,
      direction,
      setLocale,
      isRTL: direction === 'rtl',
      t,
    }),
    [locale, direction]
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
