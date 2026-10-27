/**
 * Daily Summary & Day-over-Day Calculations
 *
 * Implements authoritative totals for the 5 key daily reporting categories:
 * 1. Total academic education time (academic_study_minutes)
 * 2. Total pages of books read (islamic_book_pages + other_literature_pages)
 * 3. Total time spent on organizational activities (org_dawah_minutes + org_meeting_minutes)
 * 4. Total rest time (routine_exercise_minutes or routine_rest_minutes)
 * 5. Total sleep time (routine_sleep_hours in minutes)
 */

export interface DailySummaryTotals {
  academicStudyMinutes: number | null;
  bookPages: number | null;
  organizationalMinutes: number | null;
  restMinutes: number | null;
  sleepMinutes: number | null;
}

export type MetricComparisonStatus = 'increase' | 'decrease' | 'same' | 'no_comparison';

export interface MetricComparisonItem {
  id: string;
  label: string;
  todayValue: number | null;
  todayFormatted: string;
  yesterdayValue: number | null;
  yesterdayFormatted: string;
  diffValue: number | null;
  diffFormatted: string;
  status: MetricComparisonStatus;
  unit: string;
}

export interface DailySummaryComparison {
  categories: MetricComparisonItem[];
  yesterdayDateKey: string | null;
  hasYesterdayData: boolean;
}

/**
 * Format total minutes into hours and minutes
 * e.g., 90 -> "1h 30m" (en), "১ঘ ৩০মি" (bn), or "١ س ٣٠ د" (ar)
 */
export function formatMinutes(minutes: number | null | undefined, lang: 'bn' | 'en' | 'ar' = 'bn'): string {
  if (minutes === null || minutes === undefined || isNaN(minutes)) {
    if (lang === 'ar') return 'لا توجد بيانات';
    return lang === 'bn' ? 'তথ্য নেই' : 'No data';
  }

  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const remainingMins = rounded % 60;

  const toBn = (num: number) =>
    String(num).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);

  const toAr = (num: number) =>
    String(num).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);

  if (lang === 'ar') {
    if (hours === 0 && remainingMins === 0) return '٠ د';
    if (hours === 0) return `${toAr(remainingMins)} د`;
    if (remainingMins === 0) return `${toAr(hours)} س`;
    return `${toAr(hours)} س ${toAr(remainingMins)} د`;
  }

  if (lang === 'bn') {
    if (hours === 0 && remainingMins === 0) return '০মি';
    if (hours === 0) return `${toBn(remainingMins)}মি`;
    if (remainingMins === 0) return `${toBn(hours)}ঘ`;
    return `${toBn(hours)}ঘ ${toBn(remainingMins)}মি`;
  }

  if (hours === 0 && remainingMins === 0) return '0m';
  if (hours === 0) return `${remainingMins}m`;
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}m`;
}

/**
 * Format page count
 * e.g., 25 -> "25 pages", "২৫ পৃষ্ঠা", or "٢٥ صفحة"
 */
export function formatPages(pages: number | null | undefined, lang: 'bn' | 'en' | 'ar' = 'bn'): string {
  if (pages === null || pages === undefined || isNaN(pages)) {
    if (lang === 'ar') return 'لا توجد بيانات';
    return lang === 'bn' ? 'তথ্য নেই' : 'No data';
  }

  const rounded = Math.round(pages);
  const toBn = (num: number) =>
    String(num).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);

  const toAr = (num: number) =>
    String(num).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);

  if (lang === 'ar') {
    return `${toAr(rounded)} صفحة`;
  }

  if (lang === 'bn') {
    return `${toBn(rounded)} পৃষ্ঠা`;
  }
  return `${rounded} pages`;
}

/**
 * Safe previous calendar day calculation across month boundaries and leap years
 */
export function getPreviousDateKey(dateKey: string): string {
  const parts = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().substring(0, 10);
}

/**
 * Extracts and sums daily values into the 5 core summary categories
 */
export function calculateDailySummary(values: Record<string, any> = {}): DailySummaryTotals {
  const getNum = (key: string): number | null => {
    const val = values[key];
    if (typeof val === 'number' && !isNaN(val)) {
      return Math.max(0, val);
    }
    return null;
  };

  // 1. Total academic education time
  const academicStudyMinutes = getNum('academic_study_minutes');

  // 2. Total pages of books read (islamic + other literature)
  const islamicPages = getNum('islamic_book_pages');
  const otherPages = getNum('other_literature_pages');
  let bookPages: number | null = null;
  if (islamicPages !== null || otherPages !== null) {
    bookPages = (islamicPages || 0) + (otherPages || 0);
  }

  // 3. Total time spent on organizational activities (dawah + meetings)
  const dawahMins = getNum('org_dawah_minutes');
  const meetingMins = getNum('org_meeting_minutes');
  let organizationalMinutes: number | null = null;
  if (dawahMins !== null || meetingMins !== null) {
    organizationalMinutes = (dawahMins || 0) + (meetingMins || 0);
  }

  // 4. Total rest time
  const restVal = getNum('routine_rest_minutes') ?? getNum('routine_exercise_minutes');
  const restMinutes = restVal !== null ? restVal : null;

  // 5. Total sleep time (routine_sleep_hours converted into minutes)
  const sleepHours = getNum('routine_sleep_hours');
  const sleepMinutes = sleepHours !== null ? Math.round(sleepHours * 60) : null;

  return {
    academicStudyMinutes,
    bookPages,
    organizationalMinutes,
    restMinutes,
    sleepMinutes,
  };
}

/**
 * Compares today's totals against yesterday's report
 */
export function compareDailySummaries(
  today: DailySummaryTotals,
  yesterday: DailySummaryTotals | null,
  yesterdayDateKey: string | null,
  lang: 'bn' | 'en' | 'ar' = 'bn'
): DailySummaryComparison {
  const hasYesterdayData = yesterday !== null;

  const toBn = (num: number) =>
    String(num).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);

  const toAr = (num: number) =>
    String(num).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);

  const buildDurationComparison = (
    id: string,
    label: string,
    todayVal: number | null,
    yesterdayVal: number | null
  ): MetricComparisonItem => {
    const todayFormatted = formatMinutes(todayVal, lang);
    const yesterdayFormatted = hasYesterdayData
      ? formatMinutes(yesterdayVal, lang)
      : lang === 'ar'
      ? 'لا يوجد تقرير'
      : lang === 'bn'
      ? 'রিপোর্ট নেই'
      : 'No report';

    const unit = lang === 'ar' ? 'دقيقة' : lang === 'bn' ? 'মিনিট' : 'min';

    if (!hasYesterdayData || todayVal === null || yesterdayVal === null) {
      return {
        id,
        label,
        todayValue: todayVal,
        todayFormatted,
        yesterdayValue: yesterdayVal,
        yesterdayFormatted,
        diffValue: null,
        diffFormatted: '-',
        status: 'no_comparison',
        unit,
      };
    }

    const diff = todayVal - yesterdayVal;
    let status: MetricComparisonStatus = 'same';
    if (diff > 0) status = 'increase';
    else if (diff < 0) status = 'decrease';

    const absDiff = Math.abs(diff);
    const formattedAbs = formatMinutes(absDiff, lang);
    const diffFormatted =
      diff > 0
        ? `+${formattedAbs}`
        : diff < 0
        ? `-${formattedAbs}`
        : lang === 'ar'
        ? '٠ د'
        : lang === 'bn'
        ? '০মি'
        : '0m';

    return {
      id,
      label,
      todayValue: todayVal,
      todayFormatted,
      yesterdayValue: yesterdayVal,
      yesterdayFormatted,
      diffValue: diff,
      diffFormatted,
      status,
      unit,
    };
  };

  const buildPagesComparison = (
    id: string,
    label: string,
    todayVal: number | null,
    yesterdayVal: number | null
  ): MetricComparisonItem => {
    const todayFormatted = formatPages(todayVal, lang);
    const yesterdayFormatted = hasYesterdayData
      ? formatPages(yesterdayVal, lang)
      : lang === 'ar'
      ? 'لا يوجد تقرير'
      : lang === 'bn'
      ? 'রিপোর্ট নেই'
      : 'No report';

    const unit = lang === 'ar' ? 'صفحة' : lang === 'bn' ? 'পৃষ্ঠা' : 'pages';

    if (!hasYesterdayData || todayVal === null || yesterdayVal === null) {
      return {
        id,
        label,
        todayValue: todayVal,
        todayFormatted,
        yesterdayValue: yesterdayVal,
        yesterdayFormatted,
        diffValue: null,
        diffFormatted: '-',
        status: 'no_comparison',
        unit,
      };
    }

    const diff = todayVal - yesterdayVal;
    let status: MetricComparisonStatus = 'same';
    if (diff > 0) status = 'increase';
    else if (diff < 0) status = 'decrease';

    const absDiff = Math.abs(diff);
    const formattedNum = lang === 'ar' ? toAr(absDiff) : lang === 'bn' ? toBn(absDiff) : absDiff;
    const diffFormatted =
      diff > 0
        ? `+${formattedNum} ${unit}`
        : diff < 0
        ? `-${formattedNum} ${unit}`
        : lang === 'ar'
        ? '٠ صفحة'
        : lang === 'bn'
        ? '০ পৃষ্ঠা'
        : '0 pages';

    return {
      id,
      label,
      todayValue: todayVal,
      todayFormatted,
      yesterdayValue: yesterdayVal,
      yesterdayFormatted,
      diffValue: diff,
      diffFormatted,
      status,
      unit,
    };
  };

  const categories: MetricComparisonItem[] = [
    buildDurationComparison(
      'academic',
      lang === 'ar'
        ? 'الدراسة الأكاديمية والمنهجية'
        : lang === 'bn'
        ? 'প্রাতিষ্ঠানিক ও পাঠ্যবই অধ্যয়ন'
        : 'Academic Education',
      today.academicStudyMinutes,
      yesterday ? yesterday.academicStudyMinutes : null
    ),
    buildPagesComparison(
      'reading',
      lang === 'ar'
        ? 'قراءة الكتب (إسلامية وأدبية)'
        : lang === 'bn'
        ? 'বই পাঠ (ইসলামী ও সাহিত্য)'
        : 'Book Pages Read',
      today.bookPages,
      yesterday ? yesterday.bookPages : null
    ),
    buildDurationComparison(
      'organizational',
      lang === 'ar'
        ? 'الأنشطة والمسؤوليات الدعوية'
        : lang === 'bn'
        ? 'সাংগঠনিক দায়িত্ব ও সময়'
        : 'Organizational Activities',
      today.organizationalMinutes,
      yesterday ? yesterday.organizationalMinutes : null
    ),
    buildDurationComparison(
      'rest',
      lang === 'ar'
        ? 'الرياضة والراحة'
        : lang === 'bn'
        ? 'শরীরচর্চা ও বিশ্রাম'
        : 'Rest & Recreation',
      today.restMinutes,
      yesterday ? yesterday.restMinutes : null
    ),
    buildDurationComparison(
      'sleep',
      lang === 'ar'
        ? 'وقت النوم'
        : lang === 'bn'
        ? 'ঘুম (দৈনন্দিন নিদ্রা)'
        : 'Sleep Time',
      today.sleepMinutes,
      yesterday ? yesterday.sleepMinutes : null
    ),
  ];

  return {
    categories,
    yesterdayDateKey,
    hasYesterdayData,
  };
}
