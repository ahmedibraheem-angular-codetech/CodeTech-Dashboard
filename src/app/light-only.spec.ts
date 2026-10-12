import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PrimeNG } from 'primeng/config';

import { appConfig } from './app.config';
import { API_LATENCY_MS } from './core/config/latency';
import { Header } from './layout/components/header/header';

describe('Light mode only', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('app-dark');
  });

  it('disables PrimeNG dark mode, including the OS "system" preference', () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    const options = TestBed.inject(PrimeNG).theme()?.options;
    expect(options?.darkModeSelector).toBe(false);
  });

  it('ignores a stale dark preference saved by an older version', () => {
    localStorage.setItem('codetech.theme', 'dark');
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    TestBed.inject(PrimeNG);

    const html = document.documentElement;
    expect(html.dataset['theme']).toBeUndefined();
    expect(html.classList.contains('app-dark')).toBe(false);
    localStorage.clear();
  });

  it('has no theme toggle in the header', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: API_LATENCY_MS, useValue: 0 }],
    });
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.pi-moon, .pi-sun')).toBeNull();
    expect(
      root.querySelector('[aria-label="تبديل المظهر"], [aria-label="Toggle theme"]'),
    ).toBeNull();
  });
});
