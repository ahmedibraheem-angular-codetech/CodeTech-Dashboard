import type { AppLanguage, Translations } from './language';

export function zipTranslations(
  ar: Record<string, string>,
  en: Record<string, string>,
): Translations {
  const keys = new Set([...Object.keys(ar), ...Object.keys(en)]);
  const paired: Translations = {};
  for (const key of keys) {
    const arabic = ar[key];
    const english = en[key];
    if (arabic === undefined || english === undefined) {
      const language: AppLanguage = arabic === undefined ? 'ar' : 'en';
      throw new Error(`Missing ${language} translation: ${key}`);
    }
    paired[key] = { ar: arabic, en: english };
  }
  return paired;
}

export function mergeTranslations(...groups: readonly Translations[]): Translations {
  const merged: Translations = {};
  for (const group of groups) {
    for (const [key, value] of Object.entries(group)) {
      if (Object.hasOwn(merged, key)) {
        throw new Error(`Duplicate translation key: ${key}`);
      }
      merged[key] = value;
    }
  }
  return merged;
}
