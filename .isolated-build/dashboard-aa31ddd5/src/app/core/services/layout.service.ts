import { Injectable, signal } from '@angular/core';

export type ContentDensity = 'comfortable' | 'compact';

const COLLAPSED_KEY = 'codetech.sidebar';
const DENSITY_KEY = 'codetech.density';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly collapsed = signal(this.readCollapsed());
  readonly mobileOpen = signal(false);
  readonly density = signal<ContentDensity>(this.readDensity());
  readonly isMobile = signal(false);

  constructor() {
    this.applyDensity();
    this.watchViewport();
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.mobileOpen.update((open) => !open);
      return;
    }
    this.collapsed.update((collapsed) => !collapsed);
    this.persistCollapsed(this.collapsed());
  }

  setCollapsed(collapsed: boolean): void {
    this.collapsed.set(collapsed);
    this.persistCollapsed(collapsed);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  setDensity(density: ContentDensity): void {
    this.density.set(density);
    this.applyDensity();
    try {
      localStorage.setItem(DENSITY_KEY, density);
    } catch {
      // Ignore private-mode storage failures.
    }
  }

  applyDensity(): void {
    document.documentElement.dataset['density'] = this.density();
  }

  private watchViewport(): void {
    if (typeof window.matchMedia !== 'function') {
      return;
    }
    const query = window.matchMedia('(max-width: 991px)');
    const apply = (matches: boolean): void => {
      this.isMobile.set(matches);
      if (!matches) {
        this.mobileOpen.set(false);
      }
    };
    apply(query.matches);
    query.addEventListener('change', (event) => apply(event.matches));
  }

  private readCollapsed(): boolean {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private readDensity(): ContentDensity {
    try {
      return localStorage.getItem(DENSITY_KEY) === 'compact' ? 'compact' : 'comfortable';
    } catch {
      return 'comfortable';
    }
  }

  private persistCollapsed(collapsed: boolean): void {
    try {
      localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    } catch {
      // Ignore private-mode storage failures.
    }
  }
}
