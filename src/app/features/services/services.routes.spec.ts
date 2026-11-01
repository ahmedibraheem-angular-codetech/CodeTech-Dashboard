import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, TitleStrategy, provideRouter, type Route } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MessageService } from 'primeng/api';

import { routes } from '../../app.routes';
import { authSession } from '../../core/auth/auth-session.fixture';
import { AuthService } from '../../core/auth/auth.service';
import { API_LATENCY_MS } from '../../core/config/latency';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { LanguageService } from '../../core/services/language.service';
import { AppTitleStrategy } from '../../core/services/title.strategy';
import { ServiceDetailPage } from './pages/service-detail/service-detail';
import { ServiceEditor } from './pages/service-editor/service-editor';
import { ServicesPage } from './pages/services-list/services-list';

const SERVICE_GRANTS = [
  'services.view',
  'services.create',
  'services.update',
  'services.delete',
] as const;

function findRoute(list: readonly Route[], path: string): Route | undefined {
  for (const route of list) {
    if (route.path === path) {
      return route;
    }
    const nested = route.children ? findRoute(route.children, path) : undefined;
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

describe('Services routes', () => {
  const servicesRoute = findRoute(routes, 'services');

  beforeEach(() => {
    // PrimeNG components in the lazy pages use ResizeObserver; jsdom does not provide it.
    globalThis.ResizeObserver ??= class {
      observe(): void {

      }
      unobserve(): void {

      }
      disconnect(): void {

      }
    };
    localStorage.setItem('codetech.language', 'ar');
    TestBed.configureTestingModule({
      providers: [
        MessageService,
        { provide: API_LATENCY_MS, useValue: 0 },
        { provide: TitleStrategy, useClass: AppTitleStrategy },

        provideRouter([servicesRoute!]),
      ],
    });
    TestBed.inject(LanguageService).set('ar');

    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...SERVICE_GRANTS],
      }),
    );
  });

  function leaf() {
    let current = TestBed.inject(Router).routerState.snapshot.root;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }

  it('declares list, new, edit, and detail with static `new` before `:id`', () => {
    expect(servicesRoute?.children?.map((route) => route.path)).toEqual([
      '',
      'new',
      ':id/edit',
      ':id',
    ]);
    expect(servicesRoute?.data?.['breadcrumb']).toBe('nav.services');
  });

  it('resolves /services to the dedicated Services list page', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/services', ServicesPage);
    expect(page).toBeInstanceOf(ServicesPage);
    expect(leaf().data['titleKey']).toBe('nav.services');
  });

  it('resolves /services/new to the editor in create mode, not the detail route', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/services/new', ServiceEditor);
    expect(leaf().data).toMatchObject({ mode: 'create', titleKey: 'service.add' });
    expect(leaf().params['id']).toBeUndefined();
  });

  it('resolves /services/:id/edit to the editor in edit mode with the id', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/services/web-development/edit', ServiceEditor);
    expect(leaf().data).toMatchObject({ mode: 'edit', titleKey: 'service.edit' });
    expect(leaf().params['id']).toBe('web-development');
  });

  it('resolves /services/:id to the detail route, not the list', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/services/web-development', ServiceDetailPage);
    expect(leaf().data['breadcrumb']).toBe(':id');
    expect(leaf().params['id']).toBe('web-development');
    expect(harness.routeNativeElement?.querySelector('app-services-page')).toBeNull();
  });

  it('keeps the Services breadcrumb and page title on the list', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/services', ServicesPage);
    const lang = TestBed.inject(LanguageService);
    expect(TestBed.inject(BreadcrumbService).crumbs()).toEqual([
      { key: 'nav.home', url: '/' },
      { key: 'nav.services', url: '/services' },
    ]);
    expect(TestBed.inject(Title).getTitle()).toBe(
      `${lang.t('nav.services')} | ${lang.t('app.name')}`,
    );
  });

  it('extends the breadcrumb and title on create and edit', async () => {
    const harness = await RouterTestingHarness.create();
    const lang = TestBed.inject(LanguageService);
    const breadcrumbs = TestBed.inject(BreadcrumbService);

    await harness.navigateByUrl('/services/new', ServiceEditor);
    expect(breadcrumbs.crumbs().map((crumb) => crumb.key)).toEqual([
      'nav.home',
      'nav.services',
      'service.add',
    ]);
    expect(TestBed.inject(Title).getTitle()).toBe(
      `${lang.t('service.add')} | ${lang.t('app.name')}`,
    );

    await harness.navigateByUrl('/services/web-development/edit', ServiceEditor);
    expect(breadcrumbs.crumbs().map((crumb) => crumb.key)).toEqual([
      'nav.home',
      'nav.services',
      'service.edit',
    ]);
  });
});
