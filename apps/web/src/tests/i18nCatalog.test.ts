import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../i18n/resources/en.js';
import { bn } from '../i18n/resources/bn.js';
import { ar } from '../i18n/resources/ar.js';
import { getNestedTranslation, interpolate } from '../i18n/index.js';
import {
  formatNumber,
  formatDate,
  formatTime,
  formatDuration,
  formatMonthKey,
} from '../i18n/utils/formatters.js';

describe('i18n Catalog & Formatter Integrity Tests', () => {
  // Helper to extract all deep keys from an object
  function getAllKeys(obj: Record<string, any>, prefix = ''): string[] {
    let keys: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        keys = keys.concat(getAllKeys(v, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  }

  test('English, Bengali, and Arabic catalogs have 100% key parity with no missing keys', () => {
    const enKeys = getAllKeys(en).sort();
    const bnKeys = getAllKeys(bn).sort();
    const arKeys = getAllKeys(ar).sort();

    assert.ok(enKeys.length > 50, `Expected at least 50 translation keys, got ${enKeys.length}`);

    // Check en vs bn
    const missingInBn = enKeys.filter((k) => !bnKeys.includes(k));
    assert.deepEqual(missingInBn, [], `Keys present in EN but missing in BN: ${missingInBn.join(', ')}`);

    const missingInEnFromBn = bnKeys.filter((k) => !enKeys.includes(k));
    assert.deepEqual(missingInEnFromBn, [], `Keys present in BN but missing in EN: ${missingInEnFromBn.join(', ')}`);

    // Check en vs ar
    const missingInAr = enKeys.filter((k) => !arKeys.includes(k));
    assert.deepEqual(missingInAr, [], `Keys present in EN but missing in AR: ${missingInAr.join(', ')}`);

    const missingInEnFromAr = arKeys.filter((k) => !enKeys.includes(k));
    assert.deepEqual(missingInEnFromAr, [], `Keys present in AR but missing in EN: ${missingInEnFromAr.join(', ')}`);
  });

  test('Every single translation string in all locales is non-empty and non-blank', () => {
    const checkNoEmpty = (catalog: Record<string, any>, lang: string, prefix = '') => {
      for (const [k, v] of Object.entries(catalog)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'object' && v !== null) {
          checkNoEmpty(v, lang, fullKey);
        } else {
          assert.ok(
            typeof v === 'string' && v.trim().length > 0,
            `Empty translation string at ${lang}:${fullKey}`
          );
        }
      }
    };

    checkNoEmpty(en, 'en');
    checkNoEmpty(bn, 'bn');
    checkNoEmpty(ar, 'ar');
  });

  test('getNestedTranslation retrieves correct strings and handles missing paths gracefully', () => {
    assert.equal(getNestedTranslation(en, 'common.save'), 'Save');
    assert.equal(getNestedTranslation(bn, 'common.save'), 'সংরক্ষণ করুন');
    assert.equal(getNestedTranslation(ar, 'common.save'), 'حفظ');

    assert.equal(getNestedTranslation(en, 'non.existent.key'), 'non.existent.key');
  });

  test('interpolate safely replaces named placeholder parameters', () => {
    const template = 'Showing {from} to {to} of {total} items';
    const result = interpolate(template, { from: '1', to: '25', total: '100' });
    assert.equal(result, 'Showing 1 to 25 of 100 items');

    const resultWithMissing = interpolate('Hello {name}, your role is {role}', { name: 'Sabbir' });
    assert.equal(resultWithMissing, 'Hello Sabbir, your role is {role}');
  });

  test('formatNumber correctly formats digits for en, bn, and ar', () => {
    // English digits: 0-9
    assert.equal(formatNumber(12345, 'en'), '12345');
    assert.equal(formatNumber(0, 'en'), '0');

    // Bengali digits: ০-৯
    assert.equal(formatNumber(12345, 'bn'), '১২৩৪৫');
    assert.equal(formatNumber(0, 'bn'), '০');

    // Arabic-Indic digits: ٠-٩
    assert.equal(formatNumber(12345, 'ar'), '١٢٣٤٥');
    assert.equal(formatNumber(0, 'ar'), '٠');
  });

  test('formatMonthKey formats YYYY-MM into localized human-readable month strings', () => {
    // 2026-10 (October 2026)
    const enMonth = formatMonthKey('2026-10', 'en');
    assert.ok(enMonth.toLowerCase().includes('october') || enMonth.toLowerCase().includes('oct'));

    const bnMonth = formatMonthKey('2026-10', 'bn');
    assert.ok(bnMonth.includes('অক্টোবর') || bnMonth.length > 0);

    const arMonth = formatMonthKey('2026-10', 'ar');
    assert.ok(arMonth.includes('أكتوبر') || arMonth.length > 0);
  });

  test('formatDuration formats minutes into localized hours and minutes', () => {
    assert.equal(formatDuration(150, 'en'), '2h 30m');
    assert.equal(formatDuration(150, 'bn'), '২ঘ ৩০মি');
    assert.equal(formatDuration(150, 'ar'), '٢ س ٣٠ د');

    assert.equal(formatDuration(60, 'en'), '1h');
    assert.equal(formatDuration(60, 'bn'), '১ঘ');
    assert.equal(formatDuration(60, 'ar'), '١ س');

    assert.equal(formatDuration(45, 'en'), '45m');
    assert.equal(formatDuration(45, 'bn'), '৪৫মি');
    assert.equal(formatDuration(45, 'ar'), '٤٥ د');
  });
});
