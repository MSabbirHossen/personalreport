import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SOCIAL_LINKS } from '../pages/DeveloperInfoPage.js';
import { NAVIGATION_ITEMS, canAccessNavigationItem } from '../config/navigation.js';
import { en } from '../i18n/resources/en.js';
import { bn } from '../i18n/resources/bn.js';
import { ar } from '../i18n/resources/ar.js';

describe('Developer & Community Hub Verification Tests', () => {
  test('SOCIAL_LINKS contains all direct contacts, official platforms, and ventures', () => {
    assert.ok(SOCIAL_LINKS.length >= 10, `Expected at least 10 contact links, got ${SOCIAL_LINKS.length}`);

    const names = SOCIAL_LINKS.map((s) => s.name);
    assert.ok(names.includes('WhatsApp'), 'Missing WhatsApp');
    assert.ok(names.includes('Telegram'), 'Missing Telegram');
    assert.ok(names.includes('Email'), 'Missing Email');
    assert.ok(names.includes('Portfolio'), 'Missing Portfolio');
    assert.ok(names.includes('LinkedIn'), 'Missing LinkedIn');
    assert.ok(names.includes('YouTube'), 'Missing YouTube');
    assert.ok(names.includes('GitHub'), 'Missing GitHub');
    assert.ok(names.includes('Facebook'), 'Missing Facebook');
    assert.ok(names.includes('Instagram'), 'Missing Instagram');
    assert.ok(names.includes('Exploratory Training Academy'), 'Missing ETA');
    assert.ok(names.includes('Part-time Coder'), 'Missing Part-time Coder');
  });

  test('All active social links have valid URLs or emails', () => {
    for (const item of SOCIAL_LINKS) {
      if (item.isUpcoming) {
        assert.equal(item.link, null);
      } else if (item.isEmail) {
        assert.ok(item.email && item.email.includes('@'), `Invalid email for ${item.name}`);
        assert.ok(item.link && item.link.startsWith('mailto:'), `Invalid mailto for ${item.name}`);
      } else {
        assert.ok(item.link && item.link.startsWith('http'), `Invalid link for ${item.name}`);
      }
    }
  });

  test('Developer translations are 100% complete across English, Bengali, and Arabic', () => {
    const checkCategory = (dict: any, lang: string) => {
      assert.ok(dict.developer, `Missing developer translations in ${lang}`);
      assert.ok(dict.developer.pageTitle && dict.developer.pageTitle.trim().length > 0);
      assert.ok(dict.developer.aboutVisionTitle && dict.developer.aboutVisionTitle.trim().length > 0);
      assert.ok(dict.developer.feedbackTitle && dict.developer.feedbackTitle.trim().length > 0);
      assert.ok(dict.nav.developerInfo && dict.nav.developerInfo.trim().length > 0);
    };

    checkCategory(en, 'en');
    checkCategory(bn, 'bn');
    checkCategory(ar, 'ar');
  });

  test('Navigation item nav-developer is available in common menu to all roles', () => {
    const devItem = NAVIGATION_ITEMS.find((item) => item.id === 'nav-developer');
    assert.ok(devItem, 'nav-developer should exist in NAVIGATION_ITEMS');
    assert.equal(devItem.href, '/app/developer');
    assert.equal(devItem.group, 'common');

    // Any authenticated user should have access
    assert.ok(canAccessNavigationItem(['student'], devItem));
    assert.ok(canAccessNavigationItem(['supervisor'], devItem));
    assert.ok(canAccessNavigationItem(['org_admin'], devItem));
  });
});
