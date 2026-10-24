import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMetricAggregate, calculateMonthlyAggregates } from '../calculations/aggregations.js';
import { MetricDefinition } from '../constants/metrics.js';

describe('Reporting Arithmetic & Aggregations Unit Tests', () => {
  const sumMetric: MetricDefinition = {
    id: 'quran_study_ayah',
    groupId: 'quran',
    nameBn: 'কুরআন অধ্যয়ন (আয়াত)',
    nameEn: "Qur'an Study (Ayat)",
    type: 'count',
    unit: 'ayat',
    aggregation: 'sum',
    order: 1,
  };

  const avgAnsweredMetric: MetricDefinition = {
    id: 'book_study_minutes',
    groupId: 'textbook',
    nameBn: 'পাঠ্যবই অধ্যয়ন (মিনিট)',
    nameEn: 'Textbook Study (Minutes)',
    type: 'duration',
    unit: 'minutes',
    aggregation: 'avg_answered_days',
    order: 2,
  };

  const avgCalendarMetric: MetricDefinition = {
    id: 'reading_literature_pages',
    groupId: 'reading',
    nameBn: 'সাহিত্য অধ্যয়ন (পৃষ্ঠা)',
    nameEn: 'Literature Pages',
    type: 'count',
    unit: 'pages',
    aggregation: 'avg_calendar_days',
    order: 3,
  };

  const boolActiveDaysMetric: MetricDefinition = {
    id: 'salah_fajr_jamaat',
    groupId: 'salah',
    nameBn: 'ফজর জামায়াত',
    nameEn: 'Fajr in Jamaat',
    type: 'boolean',
    aggregation: 'count_active_days',
    order: 4,
  };

  test('Empty month returns null instead of false zero performance', () => {
    const result = calculateMetricAggregate(sumMetric, {}, 30);
    assert.equal(result, null);
  });

  test('Sum aggregation correctly calculates totals and handles missing days', () => {
    const dailyValues = {
      '2026-09-01': { quran_study_ayah: 10 },
      '2026-09-02': { quran_study_ayah: 15 },
      '2026-09-03': {}, // Missing/unanswered day
      '2026-09-04': { quran_study_ayah: 0 }, // Explicit zero
    };
    const result = calculateMetricAggregate(sumMetric, dailyValues, 30);
    assert.equal(result, 25);
  });

  test('avg_answered_days divides only by days with valid inputs', () => {
    const dailyValues = {
      '2026-09-01': { book_study_minutes: 60 },
      '2026-09-02': { book_study_minutes: 120 },
      '2026-09-03': {}, // Unanswered
    };
    // (60 + 120) / 2 answered days = 90
    const result = calculateMetricAggregate(avgAnsweredMetric, dailyValues, 30);
    assert.equal(result, 90);
  });

  test('avg_calendar_days divides by full calendar month days (e.g. February 28 vs 29 vs 31)', () => {
    const dailyValues = {
      '2026-02-01': { reading_literature_pages: 28 },
    };
    // 28 / 28 days = 1.0
    const febNonLeap = calculateMetricAggregate(avgCalendarMetric, dailyValues, 28);
    assert.equal(febNonLeap, 1.0);

    // 28 / 29 days = 0.965... -> rounds to 1.0
    const febLeap = calculateMetricAggregate(avgCalendarMetric, dailyValues, 29);
    assert.equal(febLeap, 1.0);

    // 28 / 31 days (March/July) = 0.903... -> rounds to 0.9
    const thirtyOneDayMonth = calculateMetricAggregate(avgCalendarMetric, dailyValues, 31);
    assert.equal(thirtyOneDayMonth, 0.9);
  });

  test('count_active_days correctly counts true boolean activities', () => {
    const dailyValues = {
      '2026-09-01': { salah_fajr_jamaat: true },
      '2026-09-02': { salah_fajr_jamaat: false },
      '2026-09-03': { salah_fajr_jamaat: true },
      '2026-09-04': {},
    };
    const result = calculateMetricAggregate(boolActiveDaysMetric, dailyValues, 30);
    assert.equal(result, 2);
  });
});
