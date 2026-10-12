import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'codetech.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<AppTheme>(this.read());

  constructor() {
    this.apply();
  }

  set(theme: AppTheme): void {
    this.theme.set(theme);
    this.persist(theme);
    this.apply();
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  apply(): void {
    const theme = this.theme();
    document.documentElement.dataset['theme'] = theme;
    document.documentElement.classList.toggle('app-dark', theme === 'dark');
  }

  private read(): AppTheme {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  private persist(theme: AppTheme): void {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore private-mode storage failures.
    }
  }
}
