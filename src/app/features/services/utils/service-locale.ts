import type { LocaleText } from '../models/service.model';

export function filledLocale(value: LocaleText): boolean {
  return !!(value.ar.trim() || value.en.trim());
}
