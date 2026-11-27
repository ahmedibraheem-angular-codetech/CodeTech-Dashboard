import { Injectable, computed, signal } from '@angular/core';

export type ContentDensity = 'comfortable' | 'compact';

const COLLAPSED_KEY = 'codetech.sidebar';
const DENSITY_KEY = 'codetech.density';
const ZOOM_KEY = 'codetech.zoom';

/** Page zoom levels (1 = 100%). Stepped so zoom in/out always lands on a known value. */
export const ZOOM_LEVELS = [0.8, 0.9, 1, 1.1, 1.25, 1.5] as const;
const DEFAULT_ZOOM_INDEX = ZOOM_LEVELS.indexOf(1);

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly collapsed = signal(this.readCollapsed());
  readonly mobileOpen = signal(false);
  readonly density = signal<ContentDensity>(this.readDensity());
  readonly zoomIndex = signal(this.readZoomIndex());
  readonly canZoomIn = computed(() => this.zoomIndex() < ZOOM_LEVELS.length - 1);
  readonly canZoomOut = computed(() => this.zoomIndex() > 0);
  /** Direction the next `cycleZoom()` call moves in; flips automatically at the limits. */
  readonly zoomDirection = signal<'in' | 'out'>('in');
  readonly isMobile = signal(false);

  constructor() {
    this.applyDensity();
    this.applyZoom();
    this.watchViewport();
  }

  /** One button: steps the zoom up, and turns around to step down once the max is reached (and vice versa). */
  cycleZoom(): void {
    if (this.zoomDirection() === 'in' && !this.canZoomIn()) {
      this.zoomDirection.set('out');
    } else if (this.zoomDirection() === 'out' && !this.canZoomOut()) {
      this.zoomDirection.set('in');
    }
    if (this.zoomDirection() === 'in') {
      this.setZoomIndex(this.zoomIndex() + 1);
    } else {
      this.setZoomIndex(this.zoomIndex() - 1);
    }
  }

  applyZoom(): void {
    // `zoom` scales the whole page in Chromium/Electron and Safari.
    document.documentElement.style.setProperty('zoom', String(ZOOM_LEVELS[this.zoomIndex()]));
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

  private setZoomIndex(index: number): void {
    this.zoomIndex.set(index);
    this.applyZoom();
    try {
      localStorage.setItem(ZOOM_KEY, String(ZOOM_LEVELS[index]));
    } catch {
      // Ignore private-mode storage failures.
    }
  }

  private readZoomIndex(): number {
    try {
      const stored = Number(localStorage.getItem(ZOOM_KEY));
      const index = ZOOM_LEVELS.indexOf(stored as (typeof ZOOM_LEVELS)[number]);
      return index === -1 ? DEFAULT_ZOOM_INDEX : index;
    } catch {
      return DEFAULT_ZOOM_INDEX;
    }
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
