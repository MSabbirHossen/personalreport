/**
 * Authoritative Report Timestamp Formatting Utilities
 */
import { Locale } from '../../i18n/types.js';

export function formatReportTimestamp(
  timestamp: string | null | undefined,
  lang: Locale = 'bn'
): string | null {
  if (!timestamp) return null;

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return null;

    if (lang === 'ar') {
      return date.toLocaleString('ar-SA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    if (lang === 'bn') {
      const toBn = (str: string | number) =>
        String(str).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);

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
  lang: Locale = 'bn'
): {
  isSaved: boolean;
  label: string;
  formattedTime: string | null;
  full: string;
} {
  const notSavedMap: Record<Locale, string> = {
    bn: 'এখনও সংরক্ষণ করা হয়নি',
    en: 'Not saved yet',
    ar: 'لم يتم الحفظ بعد',
  };

  if (!report || report.status === 'empty' || (!report.lastSavedAt && !report.updatedAt && !report.createdAt)) {
    return {
      isSaved: false,
      label: notSavedMap[lang] || notSavedMap.en,
      formattedTime: null,
      full: notSavedMap[lang] || notSavedMap.en,
    };
  }

  const rawTime = report.updatedAt || report.lastSavedAt || report.createdAt;
  const formattedTime = formatReportTimestamp(rawTime, lang);

  const isCorrection = report.status === 'corrected' || (report.revision && report.revision > 1);
  let actionText = '';
  if (lang === 'ar') {
    actionText = isCorrection ? 'آخر تحديث' : 'تم الحفظ في';
  } else if (lang === 'bn') {
    actionText = isCorrection ? 'সর্বশেষ আপডেট' : 'সংরক্ষিত';
  } else {
    actionText = isCorrection ? 'Last updated' : 'Saved at';
  }

  return {
    isSaved: true,
    label: actionText,
    formattedTime,
    full: formattedTime ? `${actionText}: ${formattedTime}` : actionText,
  };
}
