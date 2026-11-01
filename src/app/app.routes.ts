import { type Routes } from '@angular/router';

import { authGuard, guestGuard, verifyGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import type { LegalDocumentKind } from './features/sections/models/legal-document.model';

const placeholder = (
  path: string,
  titleKey: string,
  permission?: string,
): Routes[number] => ({
  path,
  ...(permission ? { canActivate: [permissionGuard()] } : {}),
  loadComponent: () =>
    import('./features/sections/pages/section/section').then((m) => m.SectionPage),
  data: {
    breadcrumb: titleKey,
    titleKey,
    ...(permission ? { permission } : {}),
  },
});

const legal = (path: string, kind: LegalDocumentKind, titleKey: string): Routes[number] => {
  const prefix = kind === 'privacy' ? 'legal.privacy' : 'legal.terms';
  return {
    path,
    canActivate: [permissionGuard()],
    loadComponent: () =>
      import('./features/sections/components/legal-document-board/legal-document-board').then(
        (m) => m.LegalDocumentBoard,
      ),
    data: {
      permission: 'help_support.view',
      breadcrumb: titleKey,
      titleKey,
      kind,
      subtitleKey: `${prefix}.subtitle`,
      contentTitleKey: `${prefix}.contentTitle`,
      emptyTitleKey: `${prefix}.emptyTitle`,
      emptyHintKey: `${prefix}.emptyHint`,
      writeLabelKey: `${prefix}.write`,
      placeholderKey: `${prefix}.placeholder`,
    },
  };
};

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

    path: 'forbidden',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/pages/forbidden/forbidden').then((m) => m.ForbiddenPage),
    data: { titleKey: 'auth.forbiddenTitle' },
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        canActivate: [permissionGuard()],
        loadComponent: () => import('./features/dashboard/pages/home/home').then((m) => m.Home),
        data: {
          permission: 'home.view',
          breadcrumb: 'home.manage',
          titleKey: 'home.manage',
        },
      },
      {
        path: 'users',
        data: { breadcrumb: 'nav.manageUsers' },
        children: [
          {
            path: '',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/users/pages/users/users').then((m) => m.UsersPage),
            data: { permission: 'users.view', titleKey: 'nav.manageUsers' },
          },
          {
            path: ':id',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/users/pages/user-detail/user-detail').then(
                (m) => m.UserDetailPage,
              ),
            data: {
              permission: 'users.view',
              breadcrumb: ':id',
              titleKey: 'nav.manageUsers',
            },
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
      {
        path: 'about',
        canActivate: [permissionGuard()],
        loadComponent: () =>
          import('./features/sections/components/about-page/about-page').then((m) => m.AboutPage),
        data: {
          permission: 'about.view',
          breadcrumb: 'nav.about',
          titleKey: 'nav.about',
        },
      },
      {
        path: 'contact/inquiries',
        canActivate: [permissionGuard()],
        data: { permission: 'inquiries.view', breadcrumb: 'nav.inquiries' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/sections/components/inquiries-board/inquiries-board').then(
                (m) => m.InquiriesBoard,
              ),
            data: { titleKey: 'nav.inquiries', detailPath: '/contact/inquiries' },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/sections/components/inquiry-detail/inquiry-detail').then(
                (m) => m.InquiryDetailPage,
              ),
            data: {
              breadcrumb: ':id',
              titleKey: 'nav.inquiries',
              permissionModule: 'inquiries',
            },
          },
        ],
      },
      {
        path: 'contact/start',
        canActivate: [permissionGuard()],
        data: { permission: 'project_requests.view', breadcrumb: 'nav.startProjects' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/sections/components/inquiries-board/inquiries-board').then(
                (m) => m.InquiriesBoard,
              ),
            data: {
              titleKey: 'nav.startProjects',
              pageTitleKey: 'nav.startProjects',
              detailPath: '/contact/start',
            },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/sections/components/inquiry-detail/inquiry-detail').then(
                (m) => m.InquiryDetailPage,
              ),
            data: {
              breadcrumb: ':id',
              titleKey: 'nav.startProjects',
              permissionModule: 'project_requests',
            },
          },
        ],
      },
      placeholder('contact/new', 'nav.contactNew'),
      placeholder('contact/done', 'nav.contactDone'),
      {
        path: 'products/page',
        canActivate: [permissionGuard()],
        loadComponent: () =>
          import('./features/products/pages/products-page/products-page').then(
            (m) => m.ProductsPageManage,
          ),
        data: {
          permission: 'products.view',
          breadcrumb: 'nav.productsPage',
          titleKey: 'nav.productsPage',
        },
      },
      placeholder('products/categories', 'nav.categories', 'products.view'),
      {
        path: 'products',
        data: { breadcrumb: 'nav.productsItem' },
        children: [
          {
            path: '',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/products/pages/products-list/products-list').then(
                (m) => m.ProductsPage,
              ),
            data: {
              permission: 'products.view',
              titleKey: 'product.manage',
              breadcrumb: 'product.manage',
            },
          },
          {
            path: 'new',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/products/pages/product-editor/product-editor').then(
                (m) => m.ProductEditor,
              ),
            data: {
              permission: 'products.create',
              mode: 'create',
              titleKey: 'product.add',
              breadcrumb: 'product.add',
            },
          },
          {
            path: ':id/edit',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/products/pages/product-editor/product-editor').then(
                (m) => m.ProductEditor,
              ),
            data: {
              permission: 'products.update',
              mode: 'edit',
              titleKey: 'product.edit',
              breadcrumb: 'product.edit',
            },
          },
          {
            path: ':id',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/products/pages/product-detail/product-detail').then(
                (m) => m.ProductDetailPage,
              ),
            data: {
              permission: 'products.view',
              breadcrumb: ':id',
              titleKey: 'nav.productsItem',
            },
          },
        ],
      },
      {
        path: 'projects/page',
        canActivate: [permissionGuard()],
        loadComponent: () =>
          import('./features/projects/pages/projects-page/projects-page').then(
            (m) => m.ProjectsPageManage,
          ),
        data: {
          permission: 'projects.view',
          breadcrumb: 'nav.projectsPage',
          titleKey: 'nav.projectsPage',
        },
      },
      {
        path: 'projects',
        data: { breadcrumb: 'nav.projects' },
        children: [
          {
            path: '',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/projects/pages/projects-list/projects-list').then(
                (m) => m.ProjectsPage,
              ),
            data: {
              permission: 'projects.view',
              titleKey: 'project.manage',
              breadcrumb: 'project.manage',
            },
          },
          {
            path: 'new',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/projects/pages/project-editor/project-editor').then(
                (m) => m.ProjectEditor,
              ),
            data: {
              permission: 'projects.create',
              mode: 'create',
              titleKey: 'project.add',
              breadcrumb: 'project.add',
            },
          },
          {
            path: ':id/edit',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/projects/pages/project-editor/project-editor').then(
                (m) => m.ProjectEditor,
              ),
            data: {
              permission: 'projects.update',
              mode: 'edit',
              titleKey: 'project.edit',
              breadcrumb: 'project.edit',
            },
          },
          {
            path: ':id',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/projects/pages/project-detail/project-detail').then(
                (m) => m.ProjectDetailPage,
              ),
            data: {
              permission: 'projects.view',
              breadcrumb: ':id',
              titleKey: 'nav.projectsItem',
            },
          },
        ],
      },
      {
        path: 'services',
        data: { breadcrumb: 'nav.services' },
        children: [
          {
            path: '',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/services/pages/services-list/services-list').then(
                (m) => m.ServicesPage,
              ),

            data: { permission: 'services.view', titleKey: 'nav.services', breadcrumb: '' },
          },
          {
            path: 'new',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/services/pages/service-editor/service-editor').then(
                (m) => m.ServiceEditor,
              ),
            data: {
              permission: 'services.create',
              mode: 'create',
              titleKey: 'service.add',
              breadcrumb: 'service.add',
            },
          },
          {
            path: ':id/edit',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/services/pages/service-editor/service-editor').then(
                (m) => m.ServiceEditor,
              ),
            data: {
              permission: 'services.update',
              mode: 'edit',
              titleKey: 'service.edit',
              breadcrumb: 'service.edit',
            },
          },
          {
            path: ':id',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/services/pages/service-detail/service-detail').then(
                (m) => m.ServiceDetailPage,
              ),
            data: {
              permission: 'services.view',
              breadcrumb: ':id',
              titleKey: 'nav.services',
            },
          },
        ],
      },
      {
        path: 'knowledge',
        data: { breadcrumb: 'nav.knowledge' },
        children: [
          {
            path: '',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/knowledge/pages/knowledge-board/knowledge-board').then(
                (m) => m.KnowledgeBoard,
              ),

            data: {
              permission: 'knowledge_center.view',
              titleKey: 'nav.knowledge',
              breadcrumb: '',
            },
          },
          {
            path: 'new',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/knowledge/pages/article-editor/article-editor').then(
                (m) => m.ArticleEditor,
              ),
            data: {
              permission: 'knowledge_center.create',
              mode: 'create',
              titleKey: 'knowledge.add',
              breadcrumb: 'knowledge.add',
            },
          },
          {
            path: ':id/edit',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/knowledge/pages/article-editor/article-editor').then(
                (m) => m.ArticleEditor,
              ),
            data: {
              permission: 'knowledge_center.update',
              mode: 'edit',
              titleKey: 'knowledge.edit',
              breadcrumb: 'knowledge.edit',
            },
          },
          {
            path: ':id',
            canActivate: [permissionGuard()],
            loadComponent: () =>
              import('./features/knowledge/pages/article-detail/article-detail').then(
                (m) => m.ArticleDetail,
              ),
            data: {
              permission: 'knowledge_center.view',
              breadcrumb: ':id',
              titleKey: 'nav.knowledge',
            },
          },
        ],
      },
      {
        path: 'reviews',
        canActivate: [permissionGuard()],
        loadComponent: () =>
          import('./features/sections/components/reviews-board/reviews-board').then(
            (m) => m.ReviewsBoard,
          ),
        data: {
          permission: 'testimonials.view',
          breadcrumb: 'nav.reviews',
          titleKey: 'nav.reviews',
        },
      },
      {
        path: 'settings/permissions',
        canActivate: [permissionGuard()],
        loadComponent: () =>
          import('./features/settings/pages/permissions/permissions').then(
            (m) => m.PermissionsPage,
          ),
        data: {
          permission: 'roles.view',
          breadcrumb: 'nav.permissions',
          titleKey: 'nav.permissions',
        },
      },
      {
        path: 'settings/social',
        canActivate: [permissionGuard()],
        loadComponent: () =>
          import('./features/settings/pages/social-links/social-links').then(
            (m) => m.SocialLinksPage,
          ),
        data: {
          permission: 'site_settings.view',
          breadcrumb: 'nav.social',
          titleKey: 'nav.social',
        },
      },

      legal('support/terms', 'terms', 'nav.terms'),
      legal('support/privacy', 'privacy', 'nav.privacy'),
      {
        path: 'support/faq',
        canActivate: [permissionGuard()],
        loadComponent: () =>
          import('./features/sections/components/faq-board/faq-board').then((m) => m.FaqBoard),
        data: {
          permission: 'help_support.view',
          breadcrumb: 'nav.faq',
          titleKey: 'nav.faq',
        },
      },
      placeholder('support', 'nav.helpCenter'),
      {
        path: 'seo',
        canActivate: [permissionGuard()],
        loadComponent: () => import('./features/seo/pages/seo/seo').then((m) => m.SeoPage),
        data: {
          permission: 'seo.view',
          breadcrumb: 'nav.seo',
          titleKey: 'nav.seo',
        },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
