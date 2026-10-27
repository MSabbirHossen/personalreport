import React from "react";
import { BPSReportLogo } from "./BPSReportLogo";

type Props = { label?: string; fullScreen?: boolean; progress?: number; locale?: "bn" | "en" | "ar" };

const defaultLabels = {
  bn: "আপনার রিপোর্ট প্রস্তুত করা হচ্ছে…",
  en: "Preparing your reports…",
  ar: "جارٍ تجهيز تقاريرك…",
};

export function BPSReportLoader({ label, fullScreen = true, progress, locale = "bn" }: Props) {
  const message = label ?? defaultLabels[locale];
  return (
    <div
      className={fullScreen ? "rb-loader rb-loader--fullscreen rb-pattern" : "rb-loader"}
      role="status"
      aria-live="polite"
      aria-busy="true"
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <style>{`
        .rb-loader { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; color:var(--text); text-align:center; padding:28px; }
        .rb-loader--fullscreen { min-height:100svh; background-color:var(--bg); }
        .rb-loader__mark { display:grid; place-items:center; width:88px; height:88px; border-radius:28px; background:var(--surface); border:1px solid var(--border); box-shadow:var(--shadow-md); animation:rb-float 2.4s ease-in-out infinite; }
        .rb-loader__ring { width:112px; height:112px; display:grid; place-items:center; border:3px solid var(--border); border-top-color:var(--primary); border-inline-end-color:var(--brand-red); border-radius:50%; animation:rb-spin 1.15s linear infinite; }
        .rb-loader__message { font-weight:650; font-size:1rem; }
        .rb-loader__hint { color:var(--text-muted); font-size:.82rem; }
        .rb-loader__track { width:min(240px,70vw); height:5px; overflow:hidden; border-radius:999px; background:var(--border); }
        .rb-loader__bar { height:100%; border-radius:inherit; background:linear-gradient(90deg,var(--primary),var(--brand-red)); transition:width .25s ease; }
        @keyframes rb-spin { to { transform:rotate(360deg); } }
        @keyframes rb-float { 50% { transform:translateY(-4px); } }
        @media (prefers-reduced-motion:reduce) { .rb-loader__ring,.rb-loader__mark { animation:none; } }
      `}</style>
      <div className="rb-loader__ring">
        <div className="rb-loader__mark"><BPSReportLogo size={58} wordmark={false} /></div>
      </div>
      <div className="rb-loader__message">{message}</div>
      <div className="rb-loader__hint">BPS_Report · Better Data, Brighter Future</div>
      {typeof progress === "number" && (
        <div className="rb-loader__track" role="progressbar" aria-label={message} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, progress))}>
          <div className="rb-loader__bar" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
    </div>
  );
}

// Backward compatibility alias
export const ReportBDLoader = BPSReportLoader;
