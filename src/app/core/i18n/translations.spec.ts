import { describe, expect, it } from 'vitest';

import { mergeTranslations, zipTranslations } from './merge';
import { TRANSLATIONS } from './translations';

describe('translations', () => {
  it('keeps every key in Arabic and English', () => {
    const keys = Object.keys(TRANSLATIONS);
    // Catalog grows with features; assert parity and content, not a brittle absolute count.
    expect(keys.length).toBeGreaterThanOrEqual(1147);
    for (const [key, value] of Object.entries(TRANSLATIONS)) {
      expect(value, key).toBeDefined();
      expect(value.ar, `${key}.ar`).not.toBe('');
      expect(value.en, `${key}.en`).not.toBe('');
      expect(Object.keys(value).sort(), key).toEqual(['ar', 'en']);
    }
    expect(TRANSLATIONS['app.name']?.ar).toBeTruthy();
    expect(TRANSLATIONS['app.name']?.en).toBeTruthy();
    expect(TRANSLATIONS['nav.home']?.ar).toBeTruthy();
    expect(TRANSLATIONS['nav.home']?.en).toBeTruthy();
    expect(TRANSLATIONS['seo.title']).toEqual({ ar: 'إعدادات SEO', en: 'SEO settings' });
    expect(TRANSLATIONS['nav.seo']?.ar).toBe('إعدادات SEO');
  });

  it('requires the Arabic and English files to carry the same keys', () => {
    expect(() => zipTranslations({ 'seo.title': 'عنوان' }, {})).toThrow(
      'Missing en translation: seo.title',
    );
  });

  it('refuses to overwrite a key that another module already owns', () => {
    const first = { 'common.save': { ar: 'حفظ', en: 'Save' } };
    const second = { 'common.save': { ar: 'حفظ آخر', en: 'Save again' } };
    expect(() => mergeTranslations(first, second)).toThrow(
      'Duplicate translation key: common.save',
    );
  });
});
