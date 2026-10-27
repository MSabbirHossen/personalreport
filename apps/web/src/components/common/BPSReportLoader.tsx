import React from 'react';
import { BPSReportLogo } from './BPSReportLogo.js';

export interface BPSReportLoaderProps {
  label?: string;
  fullScreen?: boolean;
  progress?: number;
  locale?: 'bn' | 'en' | 'ar';
}

const defaultLabels: Record<'bn' | 'en' | 'ar', string> = {
  bn: 'আপনার রিপোর্ট প্রস্তুত করা হচ্ছে…',
  en: 'Preparing your reports…',
  ar: 'جارٍ تجهيز تقاريرك…',
};

export const BPSReportLoader: React.FC<BPSReportLoaderProps> = ({
  label,
  fullScreen = true,
  progress,
  locale = 'bn',
}) => {
  const message = label ?? defaultLabels[locale] ?? defaultLabels.bn;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 text-center p-6 text-theme-text ${
        fullScreen
          ? 'min-h-screen w-full fixed inset-0 z-50 bg-theme-bg rb-pattern'
          : 'p-8 rounded-2xl bg-theme-surface border border-theme-border shadow-sm'
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="relative flex items-center justify-center">
        {/* Animated heritage pulsing ring */}
        <div className="w-24 h-24 rounded-full border-2 border-theme-border border-t-[var(--primary)] border-r-[var(--brand-red)] animate-spin" />
        
        {/* Emblem floating badge */}
        <div className="absolute inset-0 m-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-theme-surface border border-theme-border shadow-md animate-pulse">
          <BPSReportLogo size={38} wordmark={false} />
        </div>
      </div>

      <div className="space-y-1">
        <p className="font-semibold text-sm sm:text-base text-theme-text">{message}</p>
        <p className="text-xs text-theme-text-muted font-latin">
          BPS Report · Better Data · Brighter Future
        </p>
      </div>

      {typeof progress === 'number' && (
        <div
          className="w-48 max-w-[70vw] h-1.5 rounded-full overflow-hidden bg-theme-border"
          role="progressbar"
          aria-label={message}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.max(0, Math.min(100, progress))}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--brand-red)] transition-all duration-300"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Backward-compatible alias
export const ReportBDLoader = BPSReportLoader;
