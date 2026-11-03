import type { PermissionName } from '../auth/auth.model';

export interface NavItem {
  id: string;
  labelKey: string;
  icon: string;
  route?: string;
  exact?: boolean;

  permission?: PermissionName;
  children?: NavItem[];
}

export interface NavPermissionContext {
  profileLoaded: boolean;
  hasPermission: (name: PermissionName) => boolean;
}

export function filterNavItems(
  items: readonly NavItem[],
  ctx: NavPermissionContext,
): NavItem[] {
  return items.flatMap((item) => {
    if (item.permission) {
      if (!ctx.profileLoaded || !ctx.hasPermission(item.permission)) {
        return [];
      }
    }
    if (item.children?.length) {
      const children = filterNavItems(item.children, ctx);
      if (children.length === 0) {
        return [];
      }
      return [{ ...item, children }];
    }
    return [item];
  });
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    labelKey: 'nav.home',
    icon: 'pi pi-home',
    route: '/',
    exact: true,
    permission: 'home.view',
  },
  {
    id: 'about',
    labelKey: 'nav.about',
    icon: 'pi pi-building',
    route: '/about',
    permission: 'about.view',
  },
  {
    id: 'inquiries',
    labelKey: 'nav.inquiries',
    icon: 'pi pi-comments',
    route: '/contact/inquiries',
    exact: false,
    permission: 'inquiries.view',
  },
  {
    id: 'start-projects',
    labelKey: 'nav.startProjects',
    icon: 'pi pi-flag',
    route: '/contact/start',
    exact: false,
    permission: 'project_requests.view',
  },
  {
    id: 'products',
    labelKey: 'nav.products',
    icon: 'pi pi-box',
    children: [
      {
        id: 'products-page',
        labelKey: 'nav.productsPage',
        icon: 'pi pi-file',
        route: '/products/page',
        permission: 'products.view',
      },
      {
        id: 'products-list',
        labelKey: 'nav.productsItem',
        icon: 'pi pi-box',
        route: '/products',
        permission: 'products.view',
      },
    ],
  },
  {
    id: 'projects',
    labelKey: 'nav.projects',
    icon: 'pi pi-briefcase',
    children: [
      {
        id: 'projects-page',
        labelKey: 'nav.projectsPage',
        icon: 'pi pi-file',
        route: '/projects/page',
        permission: 'projects.view',
      },
      {
        id: 'projects-list',
        labelKey: 'nav.projectsItem',
        icon: 'pi pi-briefcase',
        route: '/projects',
        permission: 'projects.view',
      },
    ],
  },
  {
    id: 'services',
    labelKey: 'nav.services',
    icon: 'pi pi-cog',
    route: '/services',

    exact: false,
    permission: 'services.view',
  },
  {
    id: 'knowledge',
    labelKey: 'nav.knowledge',
    icon: 'pi pi-book',
    route: '/knowledge',
    permission: 'knowledge_center.view',
  },
  {
    id: 'reviews',
    labelKey: 'nav.reviews',
    icon: 'pi pi-star',
    route: '/reviews',
    permission: 'testimonials.view',
  },
  {
    id: 'settings',
    labelKey: 'nav.settings',
    icon: 'pi pi-sliders-h',
    children: [
      {
        id: 'settings-users',
        labelKey: 'nav.manageUsers',
        icon: 'pi pi-users',
        route: '/users',
        permission: 'users.view',
      },
      {
        id: 'settings-permissions',
        labelKey: 'nav.permissions',
        icon: 'pi pi-shield',
        route: '/settings/permissions',
        permission: 'roles.view',
      },
      {
        id: 'settings-social',
        labelKey: 'nav.social',
        icon: 'pi pi-share-alt',
        route: '/settings/social',
        permission: 'site_settings.view',
      },
    ],
  },
  {
    id: 'support',
    labelKey: 'nav.support',
    icon: 'pi pi-headphones',
    children: [
      {
        id: 'support-terms',
        labelKey: 'nav.terms',
        icon: 'pi pi-file',
        route: '/support/terms',
        permission: 'help_support.view',
      },
      {
        id: 'support-privacy',
        labelKey: 'nav.privacy',
        icon: 'pi pi-lock',
        route: '/support/privacy',
        permission: 'help_support.view',
      },
      {
        id: 'support-faq',
        labelKey: 'nav.faq',
        icon: 'pi pi-question-circle',
        route: '/support/faq',
        permission: 'help_support.view',
      },
    ],
  },
  {
    id: 'seo',
    labelKey: 'nav.seo',
    icon: 'pi pi-search',
    route: '/seo',
    permission: 'seo.view',
  },
];
