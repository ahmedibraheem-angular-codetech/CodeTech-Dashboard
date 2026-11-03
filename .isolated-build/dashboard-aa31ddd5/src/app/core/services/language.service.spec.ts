import { TestBed } from '@angular/core/testing';
import { PrimeNG } from 'primeng/config';

import { LanguageService } from './language.service';

describe('LanguageService', () => {
  function create(stored?: 'ar' | 'en') {
    localStorage.clear();
    if (stored) {
      localStorage.setItem('codetech.language', stored);
    }
    TestBed.configureTestingModule({});
    return {
      lang: TestBed.inject(LanguageService),
      primeng: TestBed.inject(PrimeNG),
    };
  }

  it('defaults to Arabic with RTL and Arabic PrimeNG strings', () => {
    const { lang, primeng } = create();
    expect(lang.language()).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(primeng.translation.dayNames?.[0]).toBe('الأحد');
    expect(primeng.translation.monthNames?.[0]).toBe('يناير');
    expect(primeng.translation.firstDayOfWeek).toBe(6);
  });

  it('restores the English PrimeNG defaults when switching back', () => {
    const { lang, primeng } = create();
    lang.set('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(primeng.translation.dayNames?.[0]).toBe('Sunday');
    expect(primeng.translation.firstDayOfWeek).toBe(0);

    lang.toggle();
    expect(lang.language()).toBe('ar');
    expect(primeng.translation.dayNames?.[0]).toBe('الأحد');
  });

  it('starts in English when that was the stored choice', () => {
    const { primeng } = create('en');
    expect(primeng.translation.dayNames?.[0]).toBe('Sunday');
  });
});
