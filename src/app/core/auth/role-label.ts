import type { LanguageService } from '../services/language.service';

export function roleLabel(lang: LanguageService, role: string | null | undefined): string {
  if (!role) {
    return '';
  }
  return lang.lookup(role, lang.language()) ?? role;
}
