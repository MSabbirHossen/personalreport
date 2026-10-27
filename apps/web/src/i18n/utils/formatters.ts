import { Locale } from '../types.js';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function formatNumber(
  value: number | string | null | undefined,
  locale: Locale,
  _options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined || value === '') return '';
  const numStr = String(value);

  if (locale === 'bn') {
    return numStr.replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
  }
  if (locale === 'ar') {
    return numStr.replace(/\d/g, (d) => AR_DIGITS[Number(d)] ?? d);
  }
  return numStr;
}

export function formatDate(
  dateInput: string | Date | null | undefined,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string {
  if (!dateInput) return '';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    const intlLocale = locale === 'bn' ? 'bn-BD' : locale === 'ar' ? 'ar-SA' : 'en-US';
    return new Intl.DateTimeFormat(intlLocale, options).format(d);
  } catch {
    return String(dateInput);
  }
}

export function formatTime(
  dateInput: string | Date | null | undefined,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
): string {
  if (!dateInput) return '';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';
    const intlLocale = locale === 'bn' ? 'bn-BD' : locale === 'ar' ? 'ar-SA' : 'en-US';
    return new Intl.DateTimeFormat(intlLocale, options).format(d);
  } catch {
    return '';
  }
}

export function formatDuration(minutes: number | null | undefined, locale: Locale): string {
  if (minutes === null || minutes === undefined) return '';
  if (isNaN(minutes) || minutes < 0) return formatNumber(0, locale);

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (locale === 'bn') {
    if (hours === 0) return `${formatNumber(remainingMins, 'bn')}মি`;
    if (remainingMins === 0) return `${formatNumber(hours, 'bn')}ঘ`;
    return `${formatNumber(hours, 'bn')}ঘ ${formatNumber(remainingMins, 'bn')}মি`;
  }

  if (locale === 'ar') {
    if (hours === 0) return `${formatNumber(remainingMins, 'ar')} د`;
    if (remainingMins === 0) return `${formatNumber(hours, 'ar')} س`;
    return `${formatNumber(hours, 'ar')} س ${formatNumber(remainingMins, 'ar')} د`;
  }

  // English
  if (hours === 0) return `${remainingMins}m`;
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}m`;
}

export function formatMonthKey(monthKey: string, locale: Locale): string {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;

  const date = new Date(year, month, 1);
  const intlLocale = locale === 'bn' ? 'bn-BD' : locale === 'ar' ? 'ar-SA' : 'en-US';

  return new Intl.DateTimeFormat(intlLocale, { month: 'long', year: 'numeric' }).format(date);
}
