import React from "react";

type Props = {
  size?: number;
  wordmark?: boolean;
  tagline?: boolean;
  className?: string;
  title?: string;
};

/** Abstract emblem: green geometric shield, white central seam, and red circular accent. */
export function BPSReportLogo({
  size = 44,
  wordmark = true,
  tagline = false,
  className,
  title = "BPS_Report",
}: Props) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      focusable="false"
    >
      <path d="M32 3 56 16.5V43L32 61 8 43V16.5Z" fill="#006A4E" />
      <path d="M32 3 32 61 8 43V16.5Z" fill="#0B6B3A" />
      <path d="M32 8 50 18.5V40L32 54.5 14 40V18.5Z" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" opacity=".95" />
      <path d="M32 8V54.5" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="23" cy="29" r="9.2" fill="#E63946" stroke="#FFFFFF" strokeWidth="1.4" />
      <path d="M39 24 43 28 39 32 35 28Z" fill="#FFFFFF" opacity=".95" />
      <path d="M37 39 41 35 45 39 41 43Z" fill="#FFFFFF" opacity=".78" />
    </svg>
  );

  if (!wordmark) return <span className={className} style={{ display: "inline-flex", flexShrink: 0 }}>{mark}</span>;

  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      {mark}
      <span style={{ display: "grid", lineHeight: 1.15, minWidth: 0 }}>
        <strong style={{ fontFamily: "var(--font-latin)", fontSize: "1.08rem", letterSpacing: "-.035em", color: "var(--text)" }}>
          BPS<span style={{ color: "var(--primary)" }}>_Report</span>
        </strong>
        {tagline && <small style={{ color: "var(--text-muted)", fontSize: ".7rem", marginTop: 4 }}>Better Data · Brighter Future</small>}
      </span>
    </span>
  );
}

// Backward compatibility alias
export const ReportBDLogo = BPSReportLogo;
