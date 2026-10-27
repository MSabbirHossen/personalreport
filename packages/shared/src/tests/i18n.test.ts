import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_METRIC_GROUPS,
  getMetricLabel,
  getGroupTitle,
  getMetricUnit,
} from '../constants/metrics.js';
import {
  formatMinutes,
  formatPages,
  compareDailySummaries,
} from '../calculations/dailySummary.js';

describe('Multilingual Localization & Metric Translation Tests', () => {
  test('Every metric group has valid titles for bn, en, and ar', () => {
    for (const group of DEFAULT_METRIC_GROUPS) {
      assert.ok(group.titleBn && group.titleBn.trim().length > 0, `Group ${group.id} missing titleBn`);
      assert.ok(group.titleEn && group.titleEn.trim().length > 0, `Group ${group.id} missing titleEn`);
      assert.ok(group.titleAr && group.titleAr.trim().length > 0, `Group ${group.id} missing titleAr`);

      assert.equal(getGroupTitle(group, 'bn'), group.titleBn);
      assert.equal(getGroupTitle(group, 'en'), group.titleEn);
      assert.equal(getGroupTitle(group, 'ar'), group.titleAr);
    }
  });

  test('Every single metric in all groups has localized labels and units for bn, en, and ar', () => {
    let metricCount = 0;
    for (const group of DEFAULT_METRIC_GROUPS) {
      for (const metric of group.metrics) {
        metricCount++;
        assert.ok(metric.labelBn && metric.labelBn.trim().length > 0, `Metric ${metric.id} missing labelBn`);
        assert.ok(metric.labelEn && metric.labelEn.trim().length > 0, `Metric ${metric.id} missing labelEn`);
        assert.ok(metric.labelAr && metric.labelAr.trim().length > 0, `Metric ${metric.id} missing labelAr`);

        assert.equal(getMetricLabel(metric, 'bn'), metric.labelBn);
        assert.equal(getMetricLabel(metric, 'en'), metric.labelEn);
        assert.equal(getMetricLabel(metric, 'ar'), metric.labelAr);

        if (metric.unitBn) {
          assert.equal(getMetricUnit(metric, 'bn'), metric.unitBn);
          assert.equal(getMetricUnit(metric, 'en'), metric.unitEn);
          assert.equal(getMetricUnit(metric, 'ar'), metric.unitAr);
        }
      }
    }
    assert.ok(metricCount >= 20, `Expected at least 20 metrics, got ${metricCount}`);
  });

  test('Daily Summary duration formatting supports Arabic, Bengali, and English', () => {
    // 180 minutes -> 3 hours
    assert.equal(formatMinutes(180, 'en'), '3h');
    assert.equal(formatMinutes(180, 'bn'), '৩ঘ');
    assert.equal(formatMinutes(180, 'ar'), '٣ س');

    // 150 minutes -> 2h 30m
    assert.equal(formatMinutes(150, 'en'), '2h 30m');
    assert.equal(formatMinutes(150, 'bn'), '২ঘ ৩০মি');
    assert.equal(formatMinutes(150, 'ar'), '٢ س ٣٠ د');

    // 45 minutes -> 45m
    assert.equal(formatMinutes(45, 'en'), '45m');
    assert.equal(formatMinutes(45, 'bn'), '৪৫মি');
    assert.equal(formatMinutes(45, 'ar'), '٤٥ د');
  });

  test('Daily Summary page formatting supports Arabic, Bengali, and English', () => {
    assert.equal(formatPages(25, 'en'), '25 pages');
    assert.equal(formatPages(25, 'bn'), '২৫ পৃষ্ঠা');
    assert.equal(formatPages(25, 'ar'), '٢٥ صفحة');
  });

  test('Daily Summary comparison messages support Arabic, Bengali, and English', () => {
    const todaySummary = {
      academicStudyMinutes: 180,
      bookPages: 25,
      organizationalMinutes: 60,
      restMinutes: 30,
      sleepMinutes: 420,
    };

    const yesterdaySummary = {
      academicStudyMinutes: 120,
      bookPages: 30,
      organizationalMinutes: 60,
      restMinutes: 30,
      sleepMinutes: 420,
    };

    const compEn = compareDailySummaries(todaySummary, yesterdaySummary, '2026-10-26', 'en');
    assert.equal(compEn.categories[0].status, 'increase');
    assert.equal(compEn.categories[0].diffFormatted, '+1h');
    assert.equal(compEn.categories[0].label, 'Academic Education');

    const compBn = compareDailySummaries(todaySummary, yesterdaySummary, '2026-10-26', 'bn');
    assert.equal(compBn.categories[0].status, 'increase');
    assert.equal(compBn.categories[0].diffFormatted, '+১ঘ');
    assert.equal(compBn.categories[0].label, 'প্রাতিষ্ঠানিক ও পাঠ্যবই অধ্যয়ন');

    const compAr = compareDailySummaries(todaySummary, yesterdaySummary, '2026-10-26', 'ar');
    assert.equal(compAr.categories[0].status, 'increase');
    assert.equal(compAr.categories[0].diffFormatted, '+١ س');
    assert.equal(compAr.categories[0].label, 'الدراسة الأكاديمية والمنهجية');
  });
});
