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

  readonly crumbs = computed(() => {
    this.tick();
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

  private collect(route: ActivatedRouteSnapshot, acc: Crumb[] = [], url = ''): Crumb[] {
    const segment = route.url
      .map((part) => part.path)
      .filter(Boolean)
      .join('/');
    const next = segment ? `${url}/${segment}` : url;
    const key =
      route.data['breadcrumb'] === ':id'
        ? (route.paramMap.get('id') ?? '')
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
