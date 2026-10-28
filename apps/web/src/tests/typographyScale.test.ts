import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { en } from '../i18n/resources/en.js';
import { bn } from '../i18n/resources/bn.js';
import { ar } from '../i18n/resources/ar.js';

describe('Typography Scale & Text Size Accessibility Quality Gates', () => {
  const tokensCssPath = path.resolve(process.cwd(), 'src/styles/tokens.css');
  const indexCssPath = path.resolve(process.cwd(), 'src/index.css');
  const tailwindConfigPath = path.resolve(process.cwd(), 'tailwind.config.js');

  const tokensCss = fs.readFileSync(tokensCssPath, 'utf8');
  const indexCss = fs.readFileSync(indexCssPath, 'utf8');
  const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');

  it('tokens.css defines centralized font-scale and responsive typography tokens', () => {
    assert.match(tokensCss, /--font-scale:\s*1/, 'tokens.css must declare default --font-scale: 1');
    assert.match(tokensCss, /--lh-body:\s*1\./, 'tokens.css must define generous body line-height');
    assert.match(tokensCss, /--lh-heading:\s*1\./, 'tokens.css must define heading line-height');

    const expectedTokens = [
      '--text-2xs',
      '--text-xs',
      '--text-sm',
      '--text-base',
      '--text-lg',
      '--text-xl',
      '--text-2xl',
      '--text-3xl',
      '--text-4xl',
    ];

    for (const token of expectedTokens) {
      assert.ok(
        tokensCss.includes(token),
        `tokens.css must define centralized token "${token}"`
      );
      assert.match(
        tokensCss,
        new RegExp(`${token}:\\s*calc\\([^)]*var\\(--font-scale\\)\\)`),
        `Token "${token}" must scale dynamically with var(--font-scale)`
      );
    }
  });

  it('tokens.css configures user text-size preference modes with standard (1), large (1.15) and extra-large (1.30)', () => {
    assert.match(
      tokensCss,
      /data-text-size="standard"[\s\S]*?--font-scale:\s*1;/,
      'Standard mode must set font-scale: 1'
    );
    assert.match(
      tokensCss,
      /data-text-size="large"[\s\S]*?--font-scale:\s*1\.15;/,
      'Large mode must set font-scale: 1.15'
    );
    assert.match(
      tokensCss,
      /data-text-size="extra-large"[\s\S]*?--font-scale:\s*1\.30?;/,
      'Extra large mode must set font-scale: 1.30'
    );
  });

  it('tailwind.config.js maps typography sizes directly to CSS custom properties', () => {
    assert.ok(
      tailwindConfig.includes("fontSize:"),
      'tailwind.config.js must configure extended fontSize'
    );
    assert.ok(
      tailwindConfig.includes("'var(--text-base)'"),
      'Tailwind base size must map to var(--text-base)'
    );
    assert.ok(
      tailwindConfig.includes("'var(--text-sm)'"),
      'Tailwind sm size must map to var(--text-sm)'
    );
    assert.ok(
      tailwindConfig.includes("'var(--text-xs)'"),
      'Tailwind xs size must map to var(--text-xs)'
    );
    assert.ok(
      tailwindConfig.includes("'var(--text-lg)'"),
      'Tailwind lg size must map to var(--text-lg)'
    );
    assert.ok(
      tailwindConfig.includes("'var(--text-2xl)'"),
      'Tailwind 2xl size must map to var(--text-2xl)'
    );
  });

  it('index.css applies font-size and generous line-height to body and multilingual scripts', () => {
    assert.match(indexCss, /font-size:\s*var\(--text-base\);/, 'body must have font-size: var(--text-base)');
    assert.match(indexCss, /line-height:\s*var\(--lh-body\);/, 'body must have line-height: var(--lh-body)');

    // Bengali matra protection (>= 1.65 line-height)
    assert.match(
      indexCss,
      /:lang\(bn\)[\s\S]*?line-height:\s*1\.(6[5-9]|7|8)/,
      'Bengali must have line-height >= 1.65 to prevent diacritic/matra clipping'
    );

    // Arabic diacritic protection (>= 1.7 line-height)
    assert.match(
      indexCss,
      /:lang\(ar\)[\s\S]*?line-height:\s*1\.(7|8)/,
      'Arabic must have line-height >= 1.70 to prevent vowel mark clipping'
    );
  });

  it('Text size localization keys are 100% complete across English, Bengali, and Arabic', () => {
    const keysToCheck = [
      'textSize',
      'textSizeStandard',
      'textSizeLarge',
      'textSizeExtraLarge',
      'textSizeDescription',
      'textSizePreviewHeading',
      'textSizePreviewBody',
    ] as const;

    for (const key of keysToCheck) {
      assert.ok(en.common[key], `en.common.${key} must be defined and non-empty`);
      assert.ok(bn.common[key], `bn.common.${key} must be defined and non-empty`);
      assert.ok(ar.common[key], `ar.common.${key} must be defined and non-empty`);
    }
  });
});
