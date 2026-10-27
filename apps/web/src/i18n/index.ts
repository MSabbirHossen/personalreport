import { en } from './resources/en.js';
import { bn } from './resources/bn.js';
import { ar } from './resources/ar.js';
import { Locale, TranslationSchema } from './types.js';

export * from './types.js';
export * from './utils/formatters.js';

export const translations: Record<Locale, TranslationSchema> = {
  bn,
  en,
  ar,
};

/**
 * Safely resolves a nested dot-delimited key path in the translation schema.
 * Falls back to English, then to the key itself if not found.
 */
export function getNestedTranslation(
  dict: TranslationSchema,
  keyPath: string,
  fallbackDict?: TranslationSchema
): string {
  const parts = keyPath.split('.');
  let current: unknown = dict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      current = undefined;
      break;
    }
  }

  if (typeof current === 'string') {
    return current;
  }

  if (fallbackDict && fallbackDict !== dict) {
    let fallbackCurrent: unknown = fallbackDict;
    for (const part of parts) {
      if (fallbackCurrent && typeof fallbackCurrent === 'object' && part in fallbackCurrent) {
        fallbackCurrent = (fallbackCurrent as Record<string, unknown>)[part];
      } else {
        fallbackCurrent = undefined;
        break;
      }
    }
    if (typeof fallbackCurrent === 'string') {
      return fallbackCurrent;
    }
  }

  return keyPath;
}

/**
 * Interpolates values into translation string containing placeholders like {count} or {name}.
 */
export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`;
  });
}
