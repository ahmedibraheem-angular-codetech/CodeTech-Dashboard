import type { AppLanguage, Translations } from './language';

/** Pairs an Arabic file with its English file. Every key must exist in both. */
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

/** Combines feature dictionaries. A repeated key is a mistake, not a silent override. */
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
