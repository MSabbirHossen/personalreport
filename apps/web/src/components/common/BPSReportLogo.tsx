import React from 'react';

export interface BPSReportLogoProps {
  size?: number;
  wordmark?: boolean;
  tagline?: boolean;
  className?: string;
  title?: string;
  variant?: 'full' | 'emblem' | 'compact';
}

/**
 * BPS Report Emblem:
 * Abstract heritage geometric shield with Saudi deep green (#0B6B3A),
 * Bangladesh deep green (#006A4E), white geometric seam, red circular accent (#E63946),
 * and nested Islamic geometric star diamond craftsmanship.
 */
export const BPSReportLogo: React.FC<BPSReportLogoProps> = ({
  size = 40,
  wordmark = true,
  tagline = false,
  className = '',
  title = 'BPS Report',
  variant = 'full',
}) => {
  const showWordmark = wordmark && variant !== 'emblem';

  const emblemSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      focusable="false"
      className="shrink-0 transition-transform duration-200 hover:scale-[1.03]"
    >
      {/* Right shield half - Bangladesh deep green */}
      <path d="M32 3 56 16.5V43L32 61 8 43V16.5Z" fill="#006A4E" />
      {/* Left shield half - Saudi deep green */}
      <path d="M32 3 32 61 8 43V16.5Z" fill="#0B6B3A" />
      {/* Inner geometric contour */}
      <path
        d="M32 8 50 18.5V40L32 54.5 14 40V18.5Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity=".95"
      />
      {/* Central geometric divide / seam */}
      <path d="M32 8V54.5" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
      {/* Bangladesh flag-inspired red circular emblem accent */}
      <circle cx="23" cy="29" r="9" fill="#E63946" stroke="#FFFFFF" strokeWidth="1.4" />
      {/* Islamic geometric craftsmanship stars */}
      <path d="M39 24 43 28 39 32 35 28Z" fill="#FFFFFF" opacity=".95" />
      <path d="M37 39 41 35 45 39 41 43Z" fill="#FFFFFF" opacity=".82" />
    </svg>
  );

  if (!showWordmark) {
    return (
      <span className={`inline-flex items-center shrink-0 ${className}`}>
        {emblemSvg}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 min-w-0 ${className}`}>
      {emblemSvg}
      <span className="flex flex-col leading-tight min-w-0">
        <span className="font-bold tracking-tight text-base sm:text-lg text-theme-text font-latin flex items-center gap-0.5">
          <span>BPS</span>
          <span className="text-[var(--primary)] font-extrabold">Report</span>
        </span>
        {tagline ? (
          <span className="text-[10px] text-theme-text-muted tracking-tight font-medium">
            Better Data · Brighter Future
          </span>
        ) : (
          <span className="text-[10px] text-theme-text-muted tracking-tight">
            ব্যক্তিগত রিপোর্ট প্ল্যাটফর্ম
          </span>
        )}
      </span>
    </span>
  );
};

// Backward-compatible alias
export const ReportBDLogo = BPSReportLogo;
