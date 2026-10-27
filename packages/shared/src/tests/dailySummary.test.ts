import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDailySummary,
  compareDailySummaries,
  getPreviousDateKey,
  formatMinutes,
  formatPages,
} from '../calculations/dailySummary.js';
import { SaveDailyReportInputSchema } from '../schemas/index.js';

describe('Daily Summary & Input Validation Unit Tests', () => {
  test('Empty/null report returns null for all summary categories', () => {
    const summary = calculateDailySummary({});
    assert.equal(summary.academicStudyMinutes, null);
    assert.equal(summary.bookPages, null);
    assert.equal(summary.organizationalMinutes, null);
    assert.equal(summary.restMinutes, null);
    assert.equal(summary.sleepMinutes, null);
  });

  test('Correctly calculates Academic Education Time without double counting', () => {
    const summary = calculateDailySummary({
      academic_study_minutes: 180,
      class_attended_count: 3, // Classes count should NOT be added to duration minutes
    });
    assert.equal(summary.academicStudyMinutes, 180);
    assert.equal(formatMinutes(summary.academicStudyMinutes, 'en'), '3h');
    assert.equal(formatMinutes(summary.academicStudyMinutes, 'bn'), '৩ঘ');
  });

  test('Correctly calculates Total Book Pages Read by summing islamic and general literature', () => {
    const summary = calculateDailySummary({
      islamic_book_pages: 15,
      other_literature_pages: 10,
    });
    assert.equal(summary.bookPages, 25);
    assert.equal(formatPages(summary.bookPages, 'en'), '25 pages');
    assert.equal(formatPages(summary.bookPages, 'bn'), '২৫ পৃষ্ঠা');
  });

  test('Book pages handles partial input (only one field answered)', () => {
    const summary1 = calculateDailySummary({ islamic_book_pages: 12 });
    assert.equal(summary1.bookPages, 12);

    const summary2 = calculateDailySummary({ other_literature_pages: 8 });
    assert.equal(summary2.bookPages, 8);
  });

  test('Correctly calculates Organizational Work Time by summing dawah and meetings', () => {
    const summary = calculateDailySummary({
      org_dawah_minutes: 45,
      org_meeting_minutes: 75,
    });
    assert.equal(summary.organizationalMinutes, 120);
    assert.equal(formatMinutes(summary.organizationalMinutes, 'en'), '2h');
    assert.equal(formatMinutes(summary.organizationalMinutes, 'bn'), '২ঘ');
  });

  test('Correctly calculates Rest & Sleep Time from routine_sleep_hours into minutes', () => {
    const summary = calculateDailySummary({
      routine_exercise_minutes: 40,
      routine_sleep_hours: 7.5,
    });
    assert.equal(summary.restMinutes, 40);
    assert.equal(summary.sleepMinutes, 450); // 7.5 * 60 = 450 mins = 7h 30m
    assert.equal(formatMinutes(summary.sleepMinutes, 'en'), '7h 30m');
    assert.equal(formatMinutes(summary.sleepMinutes, 'bn'), '৭ঘ ৩০মি');
  });

  test('Legitimate zero values are preserved in summary totals', () => {
    const summary = calculateDailySummary({
      academic_study_minutes: 0,
      islamic_book_pages: 0,
      other_literature_pages: 0,
    });
    assert.equal(summary.academicStudyMinutes, 0);
    assert.equal(summary.bookPages, 0);
    assert.equal(formatMinutes(summary.academicStudyMinutes, 'en'), '0m');
    assert.equal(formatPages(summary.bookPages, 'en'), '0 pages');
  });

  test('Comparison handles missing yesterday report gracefully', () => {
    const today = calculateDailySummary({
      academic_study_minutes: 120,
    });
    const comparison = compareDailySummaries(today, null, '2026-10-26', 'bn');
    assert.equal(comparison.hasYesterdayData, false);
    const academic = comparison.categories.find((c) => c.id === 'academic')!;
    assert.equal(academic.todayFormatted, '২ঘ');
    assert.equal(academic.yesterdayFormatted, 'রিপোর্ট নেই');
    assert.equal(academic.diffFormatted, '-');
    assert.equal(academic.status, 'no_comparison');
  });

  test('Comparison correctly identifies increases, decreases, and no-change', () => {
    const today = calculateDailySummary({
      academic_study_minutes: 330, // 5h 30m
      islamic_book_pages: 20,
      org_dawah_minutes: 60,       // 1h
      routine_exercise_minutes: 60,// 1h
      routine_sleep_hours: 7,      // 7h
    });

    const yesterday = calculateDailySummary({
      academic_study_minutes: 240, // 4h
      islamic_book_pages: 15,
      org_dawah_minutes: 90,       // 1h 30m
      routine_exercise_minutes: 45,// 45m
      routine_sleep_hours: 8,      // 8h
    });

    const comp = compareDailySummaries(today, yesterday, '2026-10-26', 'en');

    // 1. Academic: 5h 30m vs 4h = +1h 30m
    const academic = comp.categories.find((c) => c.id === 'academic')!;
    assert.equal(academic.status, 'increase');
    assert.equal(academic.diffFormatted, '+1h 30m');

    // 2. Pages: 20 vs 15 = +5 pages
    const pages = comp.categories.find((c) => c.id === 'reading')!;
    assert.equal(pages.status, 'increase');
    assert.equal(pages.diffFormatted, '+5 pages');

    // 3. Organization: 1h vs 1h 30m = -30m
    const org = comp.categories.find((c) => c.id === 'organizational')!;
    assert.equal(org.status, 'decrease');
    assert.equal(org.diffFormatted, '-30m');

    // 4. Rest: 1h vs 45m = +15m
    const rest = comp.categories.find((c) => c.id === 'rest')!;
    assert.equal(rest.status, 'increase');
    assert.equal(rest.diffFormatted, '+15m');

    // 5. Sleep: 7h vs 8h = -1h
    const sleep = comp.categories.find((c) => c.id === 'sleep')!;
    assert.equal(sleep.status, 'decrease');
    assert.equal(sleep.diffFormatted, '-1h');
  });

  test('getPreviousDateKey accurately navigates month boundaries, leap years, and year-ends', () => {
    assert.equal(getPreviousDateKey('2026-10-27'), '2026-10-26');
    assert.equal(getPreviousDateKey('2026-10-01'), '2026-09-30');
    assert.equal(getPreviousDateKey('2026-03-01'), '2026-02-28'); // Non-leap year
    assert.equal(getPreviousDateKey('2024-03-01'), '2024-02-29'); // Leap year
    assert.equal(getPreviousDateKey('2026-01-01'), '2025-12-31'); // Year boundary
  });

  test('SaveDailyReportInputSchema accepts legitimate zero values and non-negative numbers', () => {
    const valid = SaveDailyReportInputSchema.safeParse({
      dateKey: '2026-10-27',
      values: {
        quran_study_ayat: 0,
        academic_study_minutes: 120,
        routine_self_reflection: true,
        notes: null,
      },
    });
    assert.equal(valid.success, true);
  });

  test('SaveDailyReportInputSchema rejects negative numeric values', () => {
    const invalid = SaveDailyReportInputSchema.safeParse({
      dateKey: '2026-10-27',
      values: {
        academic_study_minutes: -15,
      },
    });
    assert.equal(invalid.success, false);
    if (!invalid.success) {
      assert.ok(invalid.error.issues.some((i) => i.message.includes('Negative values are not permitted')));
    }
  });

  test('SaveDailyReportInputSchema rejects negative strings that represent numbers', () => {
    const invalid = SaveDailyReportInputSchema.safeParse({
      dateKey: '2026-10-27',
      values: {
        quran_study_ayat: '-5',
      },
    });
    assert.equal(invalid.success, false);
  });

  test('SaveDailyReportInputSchema rejects NaN values', () => {
    const invalid = SaveDailyReportInputSchema.safeParse({
      dateKey: '2026-10-27',
      values: {
        academic_study_minutes: NaN,
      },
    });
    assert.equal(invalid.success, false);
  });
});
