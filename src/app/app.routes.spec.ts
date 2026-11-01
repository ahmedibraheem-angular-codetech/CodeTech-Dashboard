import { type Type } from '@angular/core';
import { type Route } from '@angular/router';

import { routes } from './app.routes';
import { Home } from './features/dashboard/pages/home/home';
import { AboutPage } from './features/sections/components/about-page/about-page';
import { FaqBoard } from './features/sections/components/faq-board/faq-board';
import { InquiriesBoard } from './features/sections/components/inquiries-board/inquiries-board';
import { InquiryDetailPage } from './features/sections/components/inquiry-detail/inquiry-detail';
import { LegalDocumentBoard } from './features/sections/components/legal-document-board/legal-document-board';
import { ReviewsBoard } from './features/sections/components/reviews-board/reviews-board';
import { SectionPage } from './features/sections/pages/section/section';
import { SeoPage } from './features/seo/pages/seo/seo';
import { PermissionsPage } from './features/settings/pages/permissions/permissions';
import { SocialLinksPage } from './features/settings/pages/social-links/social-links';
import { UserDetailPage } from './features/users/pages/user-detail/user-detail';
import { UsersPage } from './features/users/pages/users/users';

function shellChildren(): Route[] {
  const shell = routes.find((route) => route.path === '' && route.canActivate);
  return shell?.children ?? [];
}

function routeAt(path: string): Route | undefined {
  return shellChildren().find((route) => route.path === path);
}

function childrenOf(path: string): Route[] {
  return routeAt(path)?.children ?? [];
}

async function loadType(route: Route | undefined): Promise<Type<unknown>> {
  expect(route?.loadComponent).toBeTruthy();
  return route!.loadComponent!() as Promise<Type<unknown>>;
}

describe('home permission route', () => {
  it('guards / with home.view and loads Home', async () => {
    const route = routeAt('');
    expect(route?.canActivate).toHaveLength(1);
    expect(typeof route?.canActivate?.[0]).toBe('function');
    expect(route?.data).toEqual({
      permission: 'home.view',
      breadcrumb: 'home.manage',
      titleKey: 'home.manage',
    });
    expect(await loadType(route)).toBe(Home);
  });
});

describe('section board routes (F1 lazy boundaries)', () => {
  it('loads AboutPage for /about', async () => {
    const route = routeAt('about');
    expect(route?.canActivate).toHaveLength(1);
    expect(typeof route?.canActivate?.[0]).toBe('function');
    expect(route?.data).toEqual({
      permission: 'about.view',
      breadcrumb: 'nav.about',
      titleKey: 'nav.about',
    });
    expect(await loadType(route)).toBe(AboutPage);
  });

  it('guards /support/faq with help_support.view', async () => {
    const route = routeAt('support/faq');
    expect(route?.canActivate).toHaveLength(1);
    expect(typeof route?.canActivate?.[0]).toBe('function');
    expect(route?.data).toEqual({
      permission: 'help_support.view',
      breadcrumb: 'nav.faq',
      titleKey: 'nav.faq',
    });
    expect(await loadType(route)).toBe(FaqBoard);
  });

  it('loads ReviewsBoard for /reviews', async () => {
    const route = routeAt('reviews');
    expect(route?.canActivate).toHaveLength(1);
    expect(typeof route?.canActivate?.[0]).toBe('function');
    expect(route?.data).toEqual({
      permission: 'testimonials.view',
      breadcrumb: 'nav.reviews',
      titleKey: 'nav.reviews',
    });
    expect(await loadType(route)).toBe(ReviewsBoard);
  });

  it('guards /users list and detail with users.view', async () => {
    const list = childrenOf('users').find((route) => route.path === '');
    const detail = childrenOf('users').find((route) => route.path === ':id');
    expect(list?.canActivate).toHaveLength(1);
    expect(detail?.canActivate).toHaveLength(1);
    expect(list?.data?.['permission']).toBe('users.view');
    expect(detail?.data?.['permission']).toBe('users.view');
    expect(await loadType(list)).toBe(UsersPage);
    expect(await loadType(detail)).toBe(UserDetailPage);
  });

  it('guards /settings/permissions with roles.view', async () => {
    const route = routeAt('settings/permissions');
    expect(route?.canActivate).toHaveLength(1);
    expect(typeof route?.canActivate?.[0]).toBe('function');
    expect(route?.data).toEqual({
      permission: 'roles.view',
      breadcrumb: 'nav.permissions',
      titleKey: 'nav.permissions',
    });
    expect(await loadType(route)).toBe(PermissionsPage);
  });

  it('guards /settings/social with site_settings.view', async () => {
    const route = routeAt('settings/social');
    expect(route?.canActivate).toHaveLength(1);
    expect(typeof route?.canActivate?.[0]).toBe('function');
    expect(route?.data).toEqual({
      permission: 'site_settings.view',
      breadcrumb: 'nav.social',
      titleKey: 'nav.social',
    });
    expect(await loadType(route)).toBe(SocialLinksPage);
  });

  it('guards /seo with seo.view', async () => {
    const route = routeAt('seo');
    expect(route?.canActivate).toHaveLength(1);
    expect(typeof route?.canActivate?.[0]).toBe('function');
    expect(route?.data).toEqual({
      permission: 'seo.view',
      breadcrumb: 'nav.seo',
      titleKey: 'nav.seo',
    });
    expect(await loadType(route)).toBe(SeoPage);
  });

  it('loads LegalDocumentBoard for terms and privacy with distinct kinds', async () => {
    const terms = routeAt('support/terms');
    const privacy = routeAt('support/privacy');
    expect(terms?.canActivate).toHaveLength(1);
    expect(privacy?.canActivate).toHaveLength(1);
    expect(terms?.data?.['permission']).toBe('help_support.view');
    expect(privacy?.data?.['permission']).toBe('help_support.view');
    expect(terms?.data?.['kind']).toBe('terms');
    expect(privacy?.data?.['kind']).toBe('privacy');
    expect(terms?.data?.['subtitleKey']).toBe('legal.terms.subtitle');
    expect(privacy?.data?.['subtitleKey']).toBe('legal.privacy.subtitle');
    expect(await loadType(terms)).toBe(LegalDocumentBoard);
    expect(await loadType(privacy)).toBe(LegalDocumentBoard);
  });

  it('loads InquiriesBoard for inquiries and start with correct detail paths', async () => {
    const inquiriesParent = routeAt('contact/inquiries');
    const startParent = routeAt('contact/start');
    expect(inquiriesParent?.canActivate).toHaveLength(1);
    expect(startParent?.canActivate).toHaveLength(1);
    expect(inquiriesParent?.data?.['permission']).toBe('inquiries.view');
    expect(startParent?.data?.['permission']).toBe('project_requests.view');

    const inquiries = childrenOf('contact/inquiries').find((r) => r.path === '');
    const start = childrenOf('contact/start').find((r) => r.path === '');
    expect(inquiries?.data?.['titleKey']).toBe('nav.inquiries');
    expect(inquiries?.data?.['detailPath']).toBe('/contact/inquiries');
    expect(start?.data?.['titleKey']).toBe('nav.startProjects');
    expect(start?.data?.['pageTitleKey']).toBe('nav.startProjects');
    expect(start?.data?.['detailPath']).toBe('/contact/start');
    expect(await loadType(inquiries)).toBe(InquiriesBoard);
    expect(await loadType(start)).toBe(InquiriesBoard);
  });

  it('keeps inquiry detail children on the same parents', async () => {
    const inquiriesDetail = childrenOf('contact/inquiries').find((r) => r.path === ':id');
    const startDetail = childrenOf('contact/start').find((r) => r.path === ':id');
    expect(inquiriesDetail?.data?.['permissionModule']).toBe('inquiries');
    expect(startDetail?.data?.['permissionModule']).toBe('project_requests');
    expect(await loadType(inquiriesDetail)).toBe(InquiryDetailPage);
    expect(await loadType(startDetail)).toBe(InquiryDetailPage);
  });

  it('uses SectionPage only for placeholders', async () => {
    for (const path of ['contact/new', 'contact/done', 'products/categories', 'support']) {
      const route = routeAt(path);
      expect(route?.data?.['titleKey']).toBeTruthy();
      expect(await loadType(route)).toBe(SectionPage);
    }
  });

  it('gates products routes with products view/create/update grants', () => {
    const page = routeAt('products/page');
    const categories = routeAt('products/categories');
    const list = childrenOf('products').find((r) => r.path === '');
    const create = childrenOf('products').find((r) => r.path === 'new');
    const edit = childrenOf('products').find((r) => r.path === ':id/edit');
    const detail = childrenOf('products').find((r) => r.path === ':id');

    expect(page?.canActivate).toHaveLength(1);
    expect(page?.data?.['permission']).toBe('products.view');
    expect(categories?.canActivate).toHaveLength(1);
    expect(categories?.data?.['permission']).toBe('products.view');
    expect(list?.canActivate).toHaveLength(1);
    expect(list?.data?.['permission']).toBe('products.view');
    expect(create?.canActivate).toHaveLength(1);
    expect(create?.data?.['permission']).toBe('products.create');
    expect(edit?.canActivate).toHaveLength(1);
    expect(edit?.data?.['permission']).toBe('products.update');
    expect(detail?.canActivate).toHaveLength(1);
    expect(detail?.data?.['permission']).toBe('products.view');
  });

  it('gates projects routes with projects view/create/update grants', () => {
    const page = routeAt('projects/page');
    const list = childrenOf('projects').find((r) => r.path === '');
    const create = childrenOf('projects').find((r) => r.path === 'new');
    const edit = childrenOf('projects').find((r) => r.path === ':id/edit');
    const detail = childrenOf('projects').find((r) => r.path === ':id');

    expect(page?.canActivate).toHaveLength(1);
    expect(page?.data?.['permission']).toBe('projects.view');
    expect(list?.canActivate).toHaveLength(1);
    expect(list?.data?.['permission']).toBe('projects.view');
    expect(create?.canActivate).toHaveLength(1);
    expect(create?.data?.['permission']).toBe('projects.create');
    expect(edit?.canActivate).toHaveLength(1);
    expect(edit?.data?.['permission']).toBe('projects.update');
    expect(detail?.canActivate).toHaveLength(1);
    expect(detail?.data?.['permission']).toBe('projects.view');
  });

  it('gates services routes with services view/create/update grants', () => {
    const list = childrenOf('services').find((r) => r.path === '');
    const create = childrenOf('services').find((r) => r.path === 'new');
    const edit = childrenOf('services').find((r) => r.path === ':id/edit');
    const detail = childrenOf('services').find((r) => r.path === ':id');

    expect(list?.canActivate).toHaveLength(1);
    expect(list?.data?.['permission']).toBe('services.view');
    expect(create?.canActivate).toHaveLength(1);
    expect(create?.data?.['permission']).toBe('services.create');
    expect(edit?.canActivate).toHaveLength(1);
    expect(edit?.data?.['permission']).toBe('services.update');
    expect(detail?.canActivate).toHaveLength(1);
    expect(detail?.data?.['permission']).toBe('services.view');
  });
});
