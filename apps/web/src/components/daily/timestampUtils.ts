/**
 * Authoritative Report Timestamp Formatting Utilities
 */

export function formatReportTimestamp(
  timestamp: string | null | undefined,
  lang: 'bn' | 'en' = 'bn'
): string | null {
  if (!timestamp) return null;

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return null;

    const toBn = (str: string | number) =>
      String(str).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);

    if (lang === 'bn') {
      const monthsBn = [
        'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'
      ];
      const day = date.getDate();
      const month = monthsBn[date.getMonth()];
      const year = date.getFullYear();

      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;

      return `${toBn(day)} ${month} ${toBn(year)}, ${toBn(hours)}:${toBn(minutes)} ${ampm}`;
    }

    // Default English format e.g. "27 Oct 2026, 12:45 PM"
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return null;
  }
}

export function getReportSaveInfo(
  report: any,
  lang: 'bn' | 'en' = 'bn'
): {
  isSaved: boolean;
  label: string;
  formattedTime: string | null;
  full: string;
} {
  if (!report || report.status === 'empty' || (!report.lastSavedAt && !report.updatedAt && !report.createdAt)) {
    return {
      isSaved: false,
      label: lang === 'bn' ? 'সংরক্ষিত নয়' : 'Not saved yet',
      formattedTime: null,
      full: lang === 'bn' ? 'এখনও সংরক্ষণ করা হয়নি' : 'Not saved yet',
    };
  }

  const rawTime = report.updatedAt || report.lastSavedAt || report.createdAt;
  const formattedTime = formatReportTimestamp(rawTime, lang);

  const isCorrection = report.status === 'corrected' || (report.revision && report.revision > 1);
  const actionText = isCorrection
    ? lang === 'bn' ? 'সর্বশেষ আপডেট' : 'Last updated'
    : lang === 'bn' ? 'সংরক্ষিত' : 'Saved at';

  return {
    isSaved: true,
    label: actionText,
    formattedTime,
    full: formattedTime ? `${actionText}: ${formattedTime}` : actionText,
  };
}
