import { describe, expect, it } from 'vitest';

import { ar } from '../../../../../public/in18/services/ar';
import { en } from '../../../../../public/in18/services/en';
import { TRANSLATIONS } from '../../../core/i18n/translations';
import { SERVICE_STEPS } from '../models/service.model';

describe('service translations', () => {
  const keys = Object.keys(en);

  it('exposes the same service.* keys in Arabic and English', () => {
    expect(Object.keys(ar).sort()).toEqual([...keys].sort());
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every((key) => key.startsWith('service.'))).toBe(true);
  });

  it('has non-empty values in both languages', () => {
    for (const key of keys) {
      expect(en[key as keyof typeof en], key).not.toBe('');
      expect(ar[key as keyof typeof ar], key).not.toBe('');
    }
  });

  it('is registered in the global dictionary with every key', () => {
    for (const key of keys) {
      expect(TRANSLATIONS[key], key).toEqual({
        ar: ar[key as keyof typeof ar],
        en: en[key as keyof typeof en],
      });
    }
    expect(Object.keys(TRANSLATIONS).filter((key) => key.startsWith('service.'))).toHaveLength(
      keys.length,
    );
  });

  it('covers every wizard step label and the service-card actions', () => {
    for (const step of SERVICE_STEPS) {
      expect(TRANSLATIONS[step.labelKey], step.labelKey).toBeDefined();
    }
    for (const key of [
      'service.editAction',
      'service.deleteAction',
      'service.publishToggle',
      'service.live',
      'service.draft',
      'service.icon',
      'service.projects',
      'service.faq',
      'service.deleteMessage',
      'service.empty',
    ]) {
      expect(TRANSLATIONS[key], key).toBeDefined();
    }
  });
});
