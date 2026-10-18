import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IsActiveMatchOptions,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { NAV_ITEMS, type NavItem } from '../../../core/config/navigation';
import { LanguageService } from '../../../core/services/language.service';
import { LayoutService } from '../../../core/services/layout.service';
import { BrandLogo } from '../../../shared/components/brand-logo/brand-logo';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, BrandLogo, UserAvatar],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly items = NAV_ITEMS;
  /** Exact path match: `/products` must not stay highlighted on `/products/page`. */
  readonly childMatch: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  };
  readonly childPrefixMatch: IsActiveMatchOptions = {
    paths: 'subset',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  };

  linkMatch(item: NavItem): IsActiveMatchOptions {
    return item.exact === false ? this.childPrefixMatch : this.childMatch;
  }
  readonly lang = inject(LanguageService);
  readonly layout = inject(LayoutService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly openIds = signal<ReadonlySet<string>>(new Set());

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => {
        this.layout.closeMobile();
        this.expandActive();
      });
    this.expandActive();
  }

  isOpen(id: string): boolean {
    return this.openIds().has(id);
  }

  toggle(id: string): void {
    this.openIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  /** `/products/new` and `/products/:id` stay on المنتجات, without matching `/products/page`. */
  productSectionActive(): boolean {
    const url = this.router.url.split('?')[0];
    if (url === '/products') {
      return true;
    }
    return (
      url.startsWith('/products/') &&
      !url.startsWith('/products/page') &&
      !url.startsWith('/products/categories')
    );
  }

  projectSectionActive(): boolean {
    const url = this.router.url.split('?')[0];
    if (url === '/projects') {
      return true;
    }
    return url.startsWith('/projects/') && !url.startsWith('/projects/page');
  }

  childActive(item: NavItem): boolean {
    return (item.children ?? []).some((child) => this.isRouteActive(child.route));
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  private expandActive(): void {
    for (const item of this.items) {
      if (item.children && this.childActive(item)) {
        this.openIds.update((current) => new Set(current).add(item.id));
      }
    }
  }

  private isRouteActive(route: string | undefined): boolean {
    if (!route) {
      return false;
    }
    return this.router.isActive(route, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }
}
