import { describe, expect, it } from 'vitest';

import { mergeTranslations, zipTranslations } from './merge';
import { TRANSLATIONS } from './translations';

describe('translations', () => {
  it('keeps every key in Arabic and English', () => {
    expect(Object.keys(TRANSLATIONS)).toHaveLength(545);
    for (const [key, value] of Object.entries(TRANSLATIONS)) {
      expect(value.ar, key).not.toBe('');
      expect(value.en, key).not.toBe('');
    }
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
