export interface NavItem {
  id: string;
  labelKey: string;
  icon: string;
  route?: string;
  exact?: boolean;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', labelKey: 'nav.home', icon: 'pi pi-home', route: '/', exact: true },
  { id: 'about', labelKey: 'nav.about', icon: 'pi pi-building', route: '/about' },
  {
    id: 'contact',
    labelKey: 'nav.contact',
    icon: 'pi pi-envelope',
    children: [
      {
        id: 'contact-inquiries',
        labelKey: 'nav.inquiries',
        icon: 'pi pi-comments',
        route: '/contact/inquiries',
        exact: false,
      },
      {
        id: 'contact-start',
        labelKey: 'nav.startProjects',
        icon: 'pi pi-flag',
        route: '/contact/start',
      },
    ],
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
      },
      {
        id: 'products-list',
        labelKey: 'nav.productsItem',
        icon: 'pi pi-box',
        route: '/products',
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
      },
      {
        id: 'projects-list',
        labelKey: 'nav.projectsItem',
        icon: 'pi pi-briefcase',
        route: '/projects',
      },
    ],
  },
  {
    id: 'services',
    labelKey: 'nav.services',
    icon: 'pi pi-cog',
    route: '/services',
  },
  {
    id: 'knowledge',
    labelKey: 'nav.knowledge',
    icon: 'pi pi-book',
    route: '/knowledge',
  },
  {
    id: 'reviews',
    labelKey: 'nav.reviews',
    icon: 'pi pi-star',
    route: '/reviews',
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
      },
      {
        id: 'settings-permissions',
        labelKey: 'nav.permissions',
        icon: 'pi pi-shield',
        route: '/settings/permissions',
      },
      {
        id: 'settings-social',
        labelKey: 'nav.social',
        icon: 'pi pi-share-alt',
        route: '/settings/social',
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
      },
      {
        id: 'support-privacy',
        labelKey: 'nav.privacy',
        icon: 'pi pi-lock',
        route: '/support/privacy',
      },
      {
        id: 'support-faq',
        labelKey: 'nav.faq',
        icon: 'pi pi-question-circle',
        route: '/support/faq',
      },
    ],
  },
  { id: 'seo', labelKey: 'nav.seo', icon: 'pi pi-search', route: '/seo' },
];
