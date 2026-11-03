import type { LocaleText } from '../models/service.model';

/** True when either locale has non-whitespace text. */
export function filledLocale(value: LocaleText): boolean {
  return !!(value.ar.trim() || value.en.trim());
}
