import React, { useContext } from 'react';
import { LanguageContext } from '../../context/LanguageContext.js';

export interface BPSReportLoaderProps {
  label?: string;
  fullScreen?: boolean;
  progress?: number;
  locale?: 'bn' | 'en' | 'ar';
}

const defaultLabels: Record<'bn' | 'en' | 'ar', string> = {
  bn: 'লোড হচ্ছে…',
  en: 'Loading…',
  ar: 'جارٍ التحميل…',
};

const subLabels: Record<'bn' | 'en' | 'ar', string> = {
  bn: 'আপনার রিপোর্ট প্রস্তুত করা হচ্ছে…',
  en: 'Preparing your reports…',
  ar: 'جارٍ تجهيز تقاريرك…',
};

export const BPSReportLoader: React.FC<BPSReportLoaderProps> = ({
  label,
  fullScreen = true,
  progress,
  locale: propLocale,
}) => {
  const langContext = useContext(LanguageContext);
  const activeLocale: 'bn' | 'en' | 'ar' = (propLocale || langContext?.locale || 'bn') as 'bn' | 'en' | 'ar';
  const message = label ?? defaultLabels[activeLocale] ?? defaultLabels.bn;
  const subMessage = subLabels[activeLocale] ?? subLabels.bn;
  const isRTL = activeLocale === 'ar';

  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 text-center p-6 text-theme-text ${
        fullScreen
          ? 'min-h-screen w-full fixed inset-0 z-50 bg-theme-bg islamic-pattern'
          : 'p-8 rounded-2xl bg-theme-surface border border-theme-border shadow-sm'
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      lang={activeLocale}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Scoped CSS for the 5-step sequenced reveal & reduced motion */}
      <style>{`
        @keyframes bpsDrawOutline {
          0% {
            stroke-dashoffset: 260;
            opacity: 0.2;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
        @keyframes bpsDrawDivider {
          0% {
            stroke-dashoffset: 70;
            opacity: 0;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
        @keyframes bpsRevealBD {
          0% {
            opacity: 0;
            transform: translateX(-4px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes bpsRevealSaudi {
          0% {
            opacity: 0;
            transform: translateX(4px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes bpsResolveSword {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes bpsSpinRing {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .bps-anim-outline {
          stroke-dasharray: 260;
          stroke-dashoffset: 0;
          animation: bpsDrawOutline 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .bps-anim-divider {
          stroke-dasharray: 70;
          stroke-dashoffset: 0;
          animation: bpsDrawDivider 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
        }
        .bps-anim-bd {
          animation: bpsRevealBD 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both;
        }
        .bps-anim-saudi {
          animation: bpsRevealSaudi 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
        }
        .bps-anim-sword {
          transform-origin: 43px 40px;
          animation: bpsResolveSword 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both;
        }
        .bps-anim-progress-ring {
          transform-origin: center;
          animation: bpsSpinRing 1.8s linear infinite 0.85s;
        }

        /* prefers-reduced-motion: disable all sequenced transforms and rotations */
        @media (prefers-reduced-motion: reduce) {
          .bps-anim-outline,
          .bps-anim-divider,
          .bps-anim-bd,
          .bps-anim-saudi,
          .bps-anim-sword,
          .bps-anim-progress-ring {
            animation: none !important;
            opacity: 1 !important;
            stroke-dashoffset: 0 !important;
            transform: none !important;
          }
          .bps-anim-progress-ring {
            opacity: 0.3 !important;
          }
        }
      `}</style>

      <div className="relative flex items-center justify-center w-28 h-28">
        {/* Step 5: Restrained circular progress ring around the static emblem (Emblem DOES NOT rotate!) */}
        <svg
          className="absolute inset-0 w-full h-full bps-anim-progress-ring pointer-events-none"
          viewBox="0 0 112 112"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Subtle background track */}
          <circle
            cx="56"
            cy="56"
            r="50"
            stroke="currentColor"
            strokeWidth="2"
            className="text-theme-border opacity-30"
          />
          {/* Active progress arc */}
          <circle
            cx="56"
            cy="56"
            r="50"
            stroke="url(#bps-loader-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="80 234"
          />
          <defs>
            <linearGradient id="bps-loader-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#006A4E" />
              <stop offset="50%" stopColor="#0B6B3A" />
              <stop offset="100%" stopColor="#E63946" />
            </linearGradient>
          </defs>
        </svg>

        {/* Static Emblem container with 5-step sequenced reveal */}
        <div className="relative w-20 h-20 rounded-2xl bg-theme-surface border border-theme-border shadow-lg flex items-center justify-center p-2">
          <svg
            viewBox="0 0 64 64"
            className="w-14 h-14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="BPS Report Emblem"
          >
            {/* Step 2: Outer shield outline */}
            <path
              d="M32 4 L56 12 V38 C56 50 32 60 32 60 C32 60 8 50 8 38 V12 Z"
              stroke="var(--theme-border, #E2E8F0)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              className="bps-anim-outline"
            />

            {/* Step 3: Bangladesh field & red circle */}
            <g className="bps-anim-bd">
              <path
                d="M32 5.5 L10 13 V38 C10 48.5 32 58 32 58 Z"
                fill="#006A4E"
              />
              {/* Bangladesh red circle */}
              <circle
                cx="21"
                cy="32"
                r="7.5"
                fill="#E63946"
              />
            </g>

            {/* Step 4: Saudi field & white authentic curved sword motif */}
            <g className="bps-anim-saudi">
              <path
                d="M32 5.5 L54 13 V38 C54 48.5 32 58 32 58 Z"
                fill="#0B6B3A"
              />
              {/* Authentic Saudi curved sword (scimitar) */}
              <g className="bps-anim-sword" fill="#FFFFFF">
                {/* Curved blade pointing left toward seam */}
                <path d="M50 35.5 C46 35.2 41 34.3 35.5 31.8 C39.5 33.2 44.5 33.9 50 34.2 Z" />
                <path d="M50 34.2 C44.5 33.9 39.5 33.2 35.5 31.8 C37 32.7 41 34.5 50 35 Z" opacity="0.9" />
                {/* Crossguard */}
                <rect x="49" y="32" width="2" height="6.5" rx="0.8" />
                {/* Pommel & grip */}
                <rect x="50.8" y="34.2" width="2.4" height="2" rx="0.6" />
                <circle cx="53.6" cy="35.2" r="1.1" />
              </g>
            </g>

            {/* Step 2 (cont.): Pure white central divider seam */}
            <path
              d="M32 5 L32 58.5"
              stroke="#FFFFFF"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="bps-anim-divider"
            />
          </svg>
        </div>
      </div>

      {/* Localized status & branding text */}
      <div className="space-y-1">
        <p className="font-semibold text-base sm:text-lg text-theme-text tracking-tight">
          {message}
        </p>
        <p className="text-xs sm:text-sm text-theme-text-muted">
          {subMessage}
        </p>
        <p className="text-xs text-theme-text-muted/70 font-latin uppercase tracking-wider pt-1">
          BPS Report · Better Data · Brighter Future
        </p>
      </div>

      {/* Optional deterministic progress indicator */}
      {typeof progress === 'number' && (
        <div
          className="w-52 max-w-[70vw] h-1.5 rounded-full overflow-hidden bg-theme-border"
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
