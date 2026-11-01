import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { authSession } from '../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../core/auth/auth.service';
import { API_LATENCY_MS } from '../../../core/config/latency';
import { NAV_ITEMS } from '../../../core/config/navigation';
import { LanguageService } from '../../../core/services/language.service';
import { Sidebar } from './sidebar';

@Component({ template: '', selector: 'app-sidebar-test-page' })
class TestPage {}

const SESSION_PERMISSIONS = [
  'home.view',
  'services.view',
  'seo.view',
  'products.view',
  'projects.view',
] as const;

describe('Sidebar Services matching', () => {
  async function renderAt(url: string) {
    localStorage.setItem('codetech.language', 'ar');
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: TestPage }]),
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: API_LATENCY_MS, useValue: 0 },
      ],
    });
    TestBed.inject(LanguageService).set('ar');
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'أحمد محمد',
        roleKey: 'roles.superAdmin',
        profileLoaded: true,
        permissions: [...SESSION_PERMISSIONS],
      }),
    );
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const active = [
      ...root.querySelectorAll('.sidebar__link.is-active, .sidebar__child.is-active'),
    ];
    return active.map((link) => link.textContent?.trim());
  }

  afterEach(() => sessionStorage.clear());

  it('uses prefix matching for the flat Services item only where nested routes exist', () => {
    const services = NAV_ITEMS.find((item) => item.id === 'services');
    expect(services).toMatchObject({ route: '/services', labelKey: 'nav.services', exact: false });
    expect(services?.children).toBeUndefined();
  });

  for (const url of [
    '/services',
    '/services/new',
    '/services/web-development/edit',
    '/services/web-development',
  ]) {
    it(`keeps Services as the only active item on ${url}`, async () => {
      expect(await renderAt(url)).toEqual(['الخدمات']);
    });
  }

  it('does not activate Services on other routes', async () => {
    expect(await renderAt('/seo')).toEqual(['إعدادات SEO']);
  });

  it('keeps the existing Products and Projects matching unchanged', async () => {
    expect(await renderAt('/products/new')).toEqual(['المنتجات']);
    TestBed.resetTestingModule();
    expect(await renderAt('/projects/wasly/edit')).toEqual(['المشاريع']);
  });

  it('keeps Home exact so it is not active on Services routes', async () => {
    const active = await renderAt('/services/new');
    expect(active).not.toContain('الرئيسية');
  });
});
