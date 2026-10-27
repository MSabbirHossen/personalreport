import React from 'react';

type Props = {
  label?: string;
  fullScreen?: boolean;
  progress?: number;
  locale?: 'bn' | 'en' | 'ar';
};

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

export function BPSReportLoader({ label, fullScreen = true, progress, locale = 'bn' }: Props) {
  const message = label ?? defaultLabels[locale];
  const subMessage = subLabels[locale];

  return (
    <div
      className={fullScreen ? 'rb-loader rb-loader--fullscreen rb-pattern' : 'rb-loader'}
      role="status"
      aria-live="polite"
      aria-busy="true"
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <style>{`
        .rb-loader { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; color:var(--text, #0f172a); text-align:center; padding:28px; }
        .rb-loader--fullscreen { min-height:100svh; background-color:var(--bg, #f8fafc); }
        .rb-loader__mark { position:relative; display:grid; place-items:center; width:80px; height:80px; border-radius:20px; background:var(--surface, #ffffff); border:1px solid var(--border, #e2e8f0); box-shadow:0 10px 15px -3px rgba(0,0,0,0.08); }
        .rb-loader__container { position:relative; width:112px; height:112px; display:flex; align-items:center; justify-content:center; }
        .rb-loader__ring { position:absolute; inset:0; width:100%; height:100%; transform-origin:center; animation:bps-spin-ring 1.8s linear infinite 0.85s; pointer-events:none; }
        .rb-loader__message { font-weight:600; font-size:1.08rem; color:var(--text, #0f172a); }
        .rb-loader__hint { color:var(--text-muted, #64748b); font-size:.85rem; }
        .rb-loader__brand { font-size:.7rem; color:var(--text-muted, #94a3b8); letter-spacing:.05em; text-transform:uppercase; margin-top:2px; }
        .rb-loader__track { width:min(240px,70vw); height:5px; overflow:hidden; border-radius:999px; background:var(--border, #e2e8f0); }
        .rb-loader__bar { height:100%; border-radius:inherit; background:linear-gradient(90deg, #006A4E, #E63946); transition:width .25s ease; }

        @keyframes bps-draw-outline { 0% { stroke-dashoffset:260; opacity:0.2; } 100% { stroke-dashoffset:0; opacity:1; } }
        @keyframes bps-draw-divider { 0% { stroke-dashoffset:70; opacity:0; } 100% { stroke-dashoffset:0; opacity:1; } }
        @keyframes bps-reveal-bd { 0% { opacity:0; transform:translateX(-4px); } 100% { opacity:1; transform:translateX(0); } }
        @keyframes bps-reveal-saudi { 0% { opacity:0; transform:translateX(4px); } 100% { opacity:1; transform:translateX(0); } }
        @keyframes bps-resolve-sword { 0% { opacity:0; transform:scale(0.92); } 100% { opacity:1; transform:scale(1); } }
        @keyframes bps-spin-ring { 100% { transform:rotate(360deg); } }

        .bps-anim-outline { stroke-dasharray:260; stroke-dashoffset:0; animation:bps-draw-outline 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .bps-anim-divider { stroke-dasharray:70; stroke-dashoffset:0; animation:bps-draw-divider 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; }
        .bps-anim-bd { animation:bps-reveal-bd 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both; }
        .bps-anim-saudi { animation:bps-reveal-saudi 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both; }
        .bps-anim-sword { transform-origin:43px 40px; animation:bps-resolve-sword 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both; }

        @media (prefers-reduced-motion:reduce) {
          .bps-anim-outline, .bps-anim-divider, .bps-anim-bd, .bps-anim-saudi, .bps-anim-sword, .rb-loader__ring {
            animation: none !important;
            opacity: 1 !important;
            stroke-dashoffset: 0 !important;
            transform: none !important;
          }
          .rb-loader__ring { opacity: 0.3 !important; }
        }
      `}</style>

      <div className="rb-loader__container">
        {/* Step 5: Circular progress ring around the static emblem */}
        <svg className="rb-loader__ring" viewBox="0 0 112 112" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="2" opacity="0.2" />
          <circle cx="56" cy="56" r="50" stroke="url(#ds-bps-loader-grad)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="80 234" />
          <defs>
            <linearGradient id="ds-bps-loader-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#006A4E" />
              <stop offset="50%" stopColor="#0B6B3A" />
              <stop offset="100%" stopColor="#E63946" />
            </linearGradient>
          </defs>
        </svg>

        {/* Static Emblem container with 5-step sequenced reveal */}
        <div className="rb-loader__mark">
          <svg viewBox="0 0 64 64" width="56" height="56" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="BPS Report Emblem">
            {/* Step 2: Outer shield outline */}
            <path d="M32 4 L56 12 V38 C56 50 32 60 32 60 C32 60 8 50 8 38 V12 Z" stroke="var(--border, #E2E8F0)" strokeWidth="1.5" strokeLinejoin="round" className="bps-anim-outline" />

            {/* Step 3: Bangladesh field & red circle */}
            <g className="bps-anim-bd">
              <path d="M32 5.5 L10 13 V38 C10 48.5 32 58 32 58 Z" fill="#006A4E" />
              <circle cx="21" cy="32" r="7.5" fill="#E63946" />
            </g>

            {/* Step 4: Saudi field & white authentic curved sword motif */}
            <g className="bps-anim-saudi">
              <path d="M32 5.5 L54 13 V38 C54 48.5 32 58 32 58 Z" fill="#0B6B3A" />
              <g className="bps-anim-sword" fill="#FFFFFF">
                <path d="M50 35.5 C46 35.2 41 34.3 35.5 31.8 C39.5 33.2 44.5 33.9 50 34.2 Z" />
                <path d="M50 34.2 C44.5 33.9 39.5 33.2 35.5 31.8 C37 32.7 41 34.5 50 35 Z" opacity="0.9" />
                <rect x="49" y="32" width="2" height="6.5" rx="0.8" />
                <rect x="50.8" y="34.2" width="2.4" height="2" rx="0.6" />
                <circle cx="53.6" cy="35.2" r="1.1" />
              </g>
            </g>

            {/* Step 2 (cont.): Pure white central divider seam */}
            <path d="M32 5 L32 58.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" className="bps-anim-divider" />
          </svg>
        </div>
      </div>

      <div className="rb-loader__message">{message}</div>
      <div className="rb-loader__hint">{subMessage}</div>
      <div className="rb-loader__brand">BPS Report · Better Data · Brighter Future</div>

      {typeof progress === 'number' && (
        <div className="rb-loader__track" role="progressbar" aria-label={message} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, progress))}>
          <div className="rb-loader__bar" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
    </div>
  );
}

// Backward compatibility alias
export const ReportBDLoader = BPSReportLoader;
