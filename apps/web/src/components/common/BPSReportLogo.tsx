import React from 'react';

export interface BPSReportLogoProps {
  size?: number;
  wordmark?: boolean;
  tagline?: boolean;
  className?: string;
  title?: string;
  variant?: 'full' | 'emblem' | 'compact' | 'monochrome';
}

/**
 * BPS Report Emblem:
 * Accurately and respectfully represents Bangladesh and Saudi Arabia:
 * - Left Field: Bangladesh deep bottle green (#006A4E) with prominent red disc (#E63946).
 * - Right Field: Saudi Arabia deep forest green (#0B6B3A) with authentic white curved Arab sword.
 * - Full Composition (size >= 56 or variant='full'): Features verified Arabic Shahada above the sword.
 * - Simplified / Compact (size < 56 or variant='compact'): Features prominent centered Saudi sword motif.
 * - Divider & Border: Architectural Islamic geometric framing with clean white central seam.
 */
export const BPSReportLogo: React.FC<BPSReportLogoProps> = ({
  size = 40,
  wordmark = true,
  tagline = false,
  className = '',
  title = 'BPS Report',
  variant = 'compact',
}) => {
  const isMonochrome = variant === 'monochrome';
  const showWordmark = wordmark && variant !== 'emblem';
  // Include full Shahada calligraphy when sufficient space is available or explicitly requested as 'full'
  const showShahada = variant === 'full' || (variant !== 'compact' && variant !== 'emblem' && size >= 56);

  const bdGreen = isMonochrome ? 'currentColor' : '#006A4E';
  const saudiGreen = isMonochrome ? 'currentColor' : '#0B6B3A';
  const bdRed = isMonochrome ? 'currentColor' : '#E63946';
  const whiteStroke = isMonochrome ? 'currentColor' : '#FFFFFF';

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
      {/* Outer Geometric Shield */}
      {/* Left: Bangladesh Deep Green Field */}
      <path
        d="M32 3 L7 16 V42 L32 61 Z"
        fill={bdGreen}
        opacity={isMonochrome ? 0.88 : 1}
      />

      {/* Right: Saudi Arabia Deep Forest Green Field */}
      <path
        d="M32 3 L57 16 V42 L32 61 Z"
        fill={saudiGreen}
        opacity={isMonochrome ? 0.72 : 1}
      />

      {/* Inner Architectural Geometric Shield Outline */}
      <path
        d="M32 7.5 L52.5 18 V39.5 L32 56 L11.5 39.5 V18 Z"
        fill="none"
        stroke={whiteStroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
        opacity={isMonochrome ? 0.9 : 0.95}
      />

      {/* Central Clean Vertical White Divider */}
      <line
        x1="32"
        y1="4.5"
        x2="32"
        y2="59"
        stroke={whiteStroke}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Bangladesh National Symbolism: Red Circular Disc on Green Field */}
      <circle
        cx="20.5"
        cy="31.5"
        r="8"
        fill={bdRed}
        stroke={whiteStroke}
        strokeWidth="1"
      />

      {/* Saudi Arabia National Symbolism */}
      {showShahada ? (
        <g>
          {/* Authentic Arabic Shahada Calligraphy (Full Display Size) */}
          <g fill={whiteStroke} textAnchor="middle" style={{ userSelect: 'none' }}>
            <text
              x="44.5"
              y="23.5"
              fontSize="4.8"
              fontWeight="700"
              fontFamily="'Noto Sans Arabic', 'Noto Naskh Arabic', 'Amiri', 'Arial', sans-serif"
              direction="rtl"
            >
              لَا إِلٰهَ إِلَّا الله
            </text>
            <text
              x="44.5"
              y="29.2"
              fontSize="4.2"
              fontWeight="700"
              fontFamily="'Noto Sans Arabic', 'Noto Naskh Arabic', 'Amiri', 'Arial', sans-serif"
              direction="rtl"
            >
              مُحَمَّدٌ رَسُولُ الله
            </text>
          </g>

          {/* Authentic White Saudi Sword (beneath the Shahada) */}
          <g fill={whiteStroke}>
            {/* Crossguard */}
            <path d="M47.2 31.5 C47.8 30.8 48.8 30.8 49.4 31.6 V40.4 C48.8 41.2 47.8 41.2 47.2 40.5 Z" />
            {/* Grip / Handle */}
            <rect x="49.2" y="34.8" width="3.6" height="2" rx="0.4" />
            {/* Pommel */}
            <path d="M52.8 34.6 C54.2 34.6 55 35.8 54.5 37.2 C53.9 38.4 52.6 38.4 52.4 36.8 Z" />
            {/* Blade pointing left toward hoist with traditional scimitar curve */}
            <path d="M47.2 34.8 L41.5 34.8 C38 34.8 36 34 34.6 32.8 C35.8 35.4 38.6 37 42.2 37 L47.2 36.6 Z" />
          </g>
        </g>
      ) : (
        /* Simplified Emblem: Authentic Saudi Curved Arab Sword prominently centered at y=31.5 */
        <g fill={whiteStroke}>
          {/* Crossguard */}
          <path d="M47.2 26.5 C47.8 25.8 48.8 25.8 49.4 26.6 V36.4 C48.8 37.2 47.8 37.2 47.2 36.5 Z" />
          {/* Grip / Handle */}
          <rect x="49.2" y="30.5" width="3.6" height="2" rx="0.4" />
          {/* Pommel */}
          <path d="M52.8 30.4 C54.2 30.4 55 31.6 54.5 33 C53.9 34.2 52.6 34.2 52.4 32.6 Z" />
          {/* Scimitar Curved Blade pointing left toward central seam */}
          <path d="M47.2 30.6 L41.5 30.6 C38 30.6 36 29.8 34.6 28.5 C35.8 31.2 38.6 32.8 42.2 32.8 L47.2 32.4 Z" />
        </g>
      )}
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
        <span className="font-bold tracking-tight text-base sm:text-lg text-theme-text font-latin flex items-center gap-1">
          <span>BPS</span>
          <span className="text-[var(--primary)] font-extrabold">Report</span>
        </span>
        {tagline ? (
          <span className="text-[10px] text-theme-text-muted tracking-tight font-medium font-latin">
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
