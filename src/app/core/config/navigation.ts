export type AppPage = 'home' | 'users' | 'settings' | 'section';

export interface NavItem {
  id: string;
  labelKey: string;
  icon: string;
  route?: string;
  fragment?: string;
  exact?: boolean;
  page?: AppPage;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', labelKey: 'nav.home', icon: 'pi pi-home', route: '/', exact: true, page: 'home' },
  { id: 'about', labelKey: 'nav.about', icon: 'pi pi-building', route: '/about', page: 'section' },
  {
    id: 'contact',
    labelKey: 'nav.contact',
    icon: 'pi pi-envelope',
    children: [
      { id: 'contact-inquiries', labelKey: 'nav.inquiries', icon: 'pi pi-comments', route: '/contact/inquiries', page: 'section' },
      { id: 'contact-start', labelKey: 'nav.startProjects', icon: 'pi pi-flag', route: '/contact/start', page: 'section' },
    ],
  },
  {
    id: 'products',
    labelKey: 'nav.products',
    icon: 'pi pi-box',
    children: [
      { id: 'products-page', labelKey: 'nav.productsPage', icon: 'pi pi-file', route: '/products/page', page: 'section' },
      { id: 'products-list', labelKey: 'nav.productsItem', icon: 'pi pi-box', route: '/products', page: 'section' },
    ],
  },
  {
    id: 'projects',
    labelKey: 'nav.projects',
    icon: 'pi pi-briefcase',
    children: [
      { id: 'projects-page', labelKey: 'nav.projectsPage', icon: 'pi pi-file', route: '/projects/page', page: 'section' },
      { id: 'projects-list', labelKey: 'nav.projectsItem', icon: 'pi pi-briefcase', route: '/projects', page: 'section' },
    ],
  },
  { id: 'services', labelKey: 'nav.services', icon: 'pi pi-cog', route: '/services', page: 'section' },
  { id: 'knowledge', labelKey: 'nav.knowledge', icon: 'pi pi-book', route: '/knowledge', page: 'section' },
  { id: 'reviews', labelKey: 'nav.reviews', icon: 'pi pi-star', route: '/reviews', page: 'section' },
  {
    id: 'settings',
    labelKey: 'nav.settings',
    icon: 'pi pi-sliders-h',
    children: [
      { id: 'settings-users', labelKey: 'nav.manageUsers', icon: 'pi pi-users', route: '/users', page: 'users' },
      { id: 'settings-permissions', labelKey: 'nav.permissions', icon: 'pi pi-shield', route: '/settings/permissions', page: 'section' },
      { id: 'settings-social', labelKey: 'nav.social', icon: 'pi pi-share-alt', route: '/settings/social', page: 'section' },
    ],
  },
  {
    id: 'support',
    labelKey: 'nav.support',
    icon: 'pi pi-headphones',
    children: [
      { id: 'support-terms', labelKey: 'nav.terms', icon: 'pi pi-file', route: '/support/terms', page: 'section' },
      { id: 'support-privacy', labelKey: 'nav.privacy', icon: 'pi pi-lock', route: '/support/privacy', page: 'section' },
      { id: 'support-faq', labelKey: 'nav.faq', icon: 'pi pi-question-circle', route: '/support/faq', page: 'section' },
    ],
  },
  { id: 'seo', labelKey: 'nav.seo', icon: 'pi pi-search', route: '/seo', page: 'section' },
];

export function collectPages(items: NavItem[] = NAV_ITEMS): NavItem[] {
  const unique = new Map<string, NavItem>();
  const visit = (list: NavItem[]): void => {
    for (const item of list) {
      if (item.route && item.page && !unique.has(item.route)) {
        unique.set(item.route, item);
      }
      if (item.children) {
        visit(item.children);
      }
    }
  };
  visit(items);
  return [...unique.values()].sort((a, b) => Number(b.route === '/') - Number(a.route === '/'));
}
