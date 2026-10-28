import { Routes } from '@angular/router';

import { authGuard, guestGuard, verifyGuard } from './core/guards/auth.guard';

const section = (path: string, titleKey: string): Routes[number] => ({
  path,
  loadComponent: () =>
    import('./features/sections/pages/section/section').then((m) => m.SectionPage),
  data: { breadcrumb: titleKey, titleKey },
});

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
    data: { titleKey: 'auth.loginTitle' },
  },
  {
    path: 'verify',
    canActivate: [verifyGuard],
    loadComponent: () => import('./features/auth/pages/verify/verify').then((m) => m.Verify),
    data: { titleKey: 'auth.verifyTitle' },
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/pages/home/home').then((m) => m.Home),
        data: { breadcrumb: 'home.manage', titleKey: 'home.manage' },
      },
      {
        path: 'users',
        data: { breadcrumb: 'nav.manageUsers' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/users/pages/users/users').then((m) => m.UsersPage),
            data: { titleKey: 'nav.manageUsers' },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/users/pages/user-detail/user-detail').then(
                (m) => m.UserDetailPage,
              ),
            data: { breadcrumb: ':id', titleKey: 'nav.manageUsers' },
          },
        ],
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/pages/settings/settings').then((m) => m.SettingsPage),
        data: { breadcrumb: 'settings.title', titleKey: 'settings.title' },
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/pages/profile/profile').then((m) => m.ProfilePage),
        data: { breadcrumb: 'profile.title', titleKey: 'profile.title' },
      },
      section('about', 'nav.about'),
      {
        path: 'contact/inquiries',
        data: { breadcrumb: 'nav.inquiries' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/sections/pages/section/section').then((m) => m.SectionPage),
            data: { titleKey: 'nav.inquiries' },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/sections/components/inquiry-detail/inquiry-detail').then(
                (m) => m.InquiryDetailPage,
              ),
            data: { breadcrumb: ':id', titleKey: 'nav.inquiries' },
          },
        ],
      },
      {
        path: 'contact/start',
        data: { breadcrumb: 'nav.startProjects' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/sections/pages/section/section').then((m) => m.SectionPage),
            data: { titleKey: 'nav.startProjects' },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/sections/components/inquiry-detail/inquiry-detail').then(
                (m) => m.InquiryDetailPage,
              ),
            data: { breadcrumb: ':id', titleKey: 'nav.startProjects' },
          },
        ],
      },
      section('contact/new', 'nav.contactNew'),
      section('contact/done', 'nav.contactDone'),




      {
        path: 'knowledge',
        data: { breadcrumb: 'nav.knowledge' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/knowledge/pages/knowledge-board/knowledge-board').then(
                (m) => m.KnowledgeBoard,
              ),
            // An empty child path inherits the parent's data; blank it so the crumb shows once.
            data: { titleKey: 'nav.knowledge', breadcrumb: '' },
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/knowledge/pages/article-editor/article-editor').then(
                (m) => m.ArticleEditor,
              ),
            data: { mode: 'create', titleKey: 'knowledge.add', breadcrumb: 'knowledge.add' },
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./features/knowledge/pages/article-editor/article-editor').then(
                (m) => m.ArticleEditor,
              ),
            data: { mode: 'edit', titleKey: 'knowledge.edit', breadcrumb: 'knowledge.edit' },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/knowledge/pages/article-detail/article-detail').then(
                (m) => m.ArticleDetail,
              ),
            data: { breadcrumb: ':id', titleKey: 'nav.knowledge' },
          },
        ],
      },
      section('reviews', 'nav.reviews'),
      {
        path: 'settings/permissions',
        loadComponent: () =>
          import('./features/settings/pages/permissions/permissions').then(
            (m) => m.PermissionsPage,
          ),
        data: { breadcrumb: 'nav.permissions', titleKey: 'nav.permissions' },
      },
      {
        path: 'settings/social',
        loadComponent: () =>
          import('./features/settings/pages/social-links/social-links').then(
            (m) => m.SocialLinksPage,
          ),
        data: { breadcrumb: 'nav.social', titleKey: 'nav.social' },
      },

      section('support/terms', 'nav.terms'),
      section('support/privacy', 'nav.privacy'),
      section('support/faq', 'nav.faq'),
      section('support', 'nav.helpCenter'),
      {
        path: 'seo',
        loadComponent: () => import('./features/seo/pages/seo/seo').then((m) => m.SeoPage),
        data: { breadcrumb: 'nav.seo', titleKey: 'nav.seo' },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
