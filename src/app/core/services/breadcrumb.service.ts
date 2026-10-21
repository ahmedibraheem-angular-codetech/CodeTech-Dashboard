import { Injectable, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, type ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs';

export interface Crumb {
  key: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);
  private readonly tick = signal(0);
  /** Optional display labels for `:id` crumbs (e.g. a user name instead of the raw id). */
  private readonly labels = signal<Readonly<Record<string, string>>>({});

  readonly crumbs = computed(() => {
    this.tick();
    this.labels();
    const collected = this.collect(this.router.routerState.snapshot.root);
    if (collected[0]?.key === 'nav.home') {
      return collected;
    }
    return [{ key: 'nav.home', url: '/' }, ...collected];
  });

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.tick.update((value) => value + 1);
    });
  }

  /** Sets a human-readable label for a `:id` breadcrumb URL. */
  setLabel(url: string, label: string): void {
    this.labels.update((current) => ({ ...current, [url]: label }));
  }

  /** Clears a previously set `:id` breadcrumb label. */
  clearLabel(url: string): void {
    this.labels.update((current) => {
      const next = { ...current };
      delete next[url];
      return next;
    });
  }

  private collect(route: ActivatedRouteSnapshot, acc: Crumb[] = [], url = ''): Crumb[] {
    const segment = route.url
      .map((part) => part.path)
      .filter(Boolean)
      .join('/');
    const next = segment ? `${url}/${segment}` : url;
    const key =
      route.data['breadcrumb'] === ':id'
        ? (this.labels()[next] ?? route.paramMap.get('id') ?? '')
        : route.data['breadcrumb'];
    if (typeof key === 'string' && key) {
      acc.push({ key, url: next || '/' });
    }
    for (const child of route.children) {
      this.collect(child, acc, next);
    }
    return acc;
  }
}
