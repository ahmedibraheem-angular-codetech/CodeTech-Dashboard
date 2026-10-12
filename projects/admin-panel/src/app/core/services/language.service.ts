import { Injectable, signal } from '@angular/core';

import { TRANSLATIONS, type AppLanguage } from '../i18n/translations';

const STORAGE_KEY = 'codetech.language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly language = signal<AppLanguage>(this.read());

  constructor() {
    this.apply();
  }

  t(key: string): string {
    const language = this.language();
    return TRANSLATIONS[key]?.[language] ?? key;
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
