import { Injectable, inject, signal } from '@angular/core';
import { PrimeNG } from 'primeng/config';

import { PRIMENG_AR } from '../i18n/primeng-locale';
import { TRANSLATIONS, type AppLanguage } from '../i18n/translations';

const STORAGE_KEY = 'codetech.language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly primeng = inject(PrimeNG);
  // PrimeNG ships English; keep its defaults so switching back restores them exactly.
  private readonly primengEnglish = { ...this.primeng.translation };
  readonly language = signal<AppLanguage>(this.read());

  constructor() {
    this.apply();
  }

  t(key: string): string {
    return this.lookup(key, this.language()) ?? key;
  }

  lookup(key: string, language: AppLanguage): string | undefined {
    return TRANSLATIONS[key]?.[language];
  }

  set(language: AppLanguage): void {
    this.language.set(language);
    this.persist(language);
    this.apply();
  }

  toggle(): void {
    this.set(this.language() === 'ar' ? 'en' : 'ar');
  }

  apply(): void {
    const language = this.language();
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    this.primeng.setTranslation(language === 'ar' ? PRIMENG_AR : this.primengEnglish);
  }

  private read(): AppLanguage {
    const stored = this.storageGet();
    return stored === 'en' ? 'en' : 'ar';
  }

  private persist(language: AppLanguage): void {
    this.storageSet(language);
  }

  private storageGet(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private storageSet(value: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore private-mode storage failures.
    }
  }
}
