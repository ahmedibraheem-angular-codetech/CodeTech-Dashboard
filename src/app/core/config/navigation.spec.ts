import { NAV_ITEMS, filterNavItems, type NavItem } from './navigation';

const SAMPLE: NavItem[] = [
  { id: 'open', labelKey: 'nav.home', icon: 'pi pi-home', route: '/' },
  {
    id: 'gated',
    labelKey: 'nav.seo',
    icon: 'pi pi-search',
    route: '/seo',

    permission: 'fixture.gated',
  },
  {
    id: 'group',
    labelKey: 'nav.settings',
    icon: 'pi pi-sliders-h',
    children: [
      {
        id: 'child-open',
        labelKey: 'nav.social',
        icon: 'pi pi-share-alt',
        route: '/settings/social',
      },
      {
        id: 'child-gated',
        labelKey: 'nav.permissions',
        icon: 'pi pi-shield',
        route: '/settings/permissions',
        permission: 'fixture.child',
      },
    ],
  },
];

describe('filterNavItems', () => {
  it('keeps items that have no permission field', () => {
    const next = filterNavItems(SAMPLE, {
      profileLoaded: true,
      hasPermission: () => false,
    });
    expect(next.map((item) => item.id)).toEqual(['open', 'group']);
    expect(next.find((item) => item.id === 'group')?.children?.map((c) => c.id)).toEqual([
      'child-open',
    ]);
  });

  it('hides gated items until the profile has loaded', () => {
    const next = filterNavItems(SAMPLE, {
      profileLoaded: false,
      hasPermission: () => true,
    });
    expect(next.map((item) => item.id)).toEqual(['open', 'group']);
    expect(next.find((item) => item.id === 'group')?.children?.map((c) => c.id)).toEqual([
      'child-open',
    ]);
  });

  it('shows gated items when the grant is held', () => {
    const next = filterNavItems(SAMPLE, {
      profileLoaded: true,
      hasPermission: (name) => name === 'fixture.gated' || name === 'fixture.child',
    });
    expect(next.map((item) => item.id)).toEqual(['open', 'gated', 'group']);
    expect(next.find((item) => item.id === 'group')?.children?.map((c) => c.id)).toEqual([
      'child-open',
      'child-gated',
    ]);
  });

  it('drops a parent group when every child is filtered out', () => {
    const onlyGatedChildren: NavItem[] = [
      {
        id: 'group',
        labelKey: 'nav.settings',
        icon: 'pi pi-sliders-h',
        children: [
          {
            id: 'child-gated',
            labelKey: 'nav.permissions',
            icon: 'pi pi-shield',
            route: '/settings/permissions',
            permission: 'fixture.child',
          },
        ],
      },
    ];
    const next = filterNavItems(onlyGatedChildren, {
      profileLoaded: true,
      hasPermission: () => false,
    });
    expect(next).toEqual([]);
  });

  it('hides a parent that has its own permission even when children would pass', () => {
    const gatedParent: NavItem[] = [
      {
        id: 'group',
        labelKey: 'nav.settings',
        icon: 'pi pi-sliders-h',
        permission: 'fixture.parent',
        children: [
          {
            id: 'child-open',
            labelKey: 'nav.social',
            icon: 'pi pi-share-alt',
            route: '/settings/social',
          },
        ],
      },
    ];
    expect(
      filterNavItems(gatedParent, {
        profileLoaded: true,
        hasPermission: () => false,
      }),
    ).toEqual([]);
    expect(
      filterNavItems(gatedParent, {
        profileLoaded: false,
        hasPermission: () => true,
      }),
    ).toEqual([]);
    const allowed = filterNavItems(gatedParent, {
      profileLoaded: true,
      hasPermission: (name) => name === 'fixture.parent',
    });
    expect(allowed.map((item) => item.id)).toEqual(['group']);
    expect(allowed[0]?.children?.map((child) => child.id)).toEqual(['child-open']);
  });

  it('before profileLoaded keeps ungated items and hides only gated ones', () => {
    const next = filterNavItems(SAMPLE, {
      profileLoaded: false,
      hasPermission: () => true,
    });
    expect(next.map((item) => item.id)).toEqual(['open', 'group']);
    expect(next.some((item) => item.id === 'gated')).toBe(false);
  });
});

describe('NAV_ITEMS permission mapping', () => {
  function byId(id: string): NavItem | undefined {
    for (const item of NAV_ITEMS) {
      if (item.id === id) {
        return item;
      }
      const child = item.children?.find((entry) => entry.id === id);
      if (child) {
        return child;
      }
    }
    return undefined;
  }

  it('assigns the agreed view grants and leaves parent groups ungated', () => {
    expect(byId('home')?.permission).toBe('home.view');
    expect(byId('about')?.permission).toBe('about.view');
    expect(byId('inquiries')?.permission).toBe('inquiries.view');
    expect(byId('start-projects')?.permission).toBe('project_requests.view');
    expect(byId('products')?.permission).toBeUndefined();
    expect(byId('products-page')?.permission).toBe('products.view');
    expect(byId('products-list')?.permission).toBe('products.view');
    expect(byId('projects')?.permission).toBeUndefined();
    expect(byId('projects-page')?.permission).toBe('projects.view');
    expect(byId('projects-list')?.permission).toBe('projects.view');
    expect(byId('services')?.permission).toBe('services.view');
    expect(byId('knowledge')?.permission).toBe('knowledge_center.view');
    expect(byId('reviews')?.permission).toBe('testimonials.view');
    expect(byId('settings')?.permission).toBeUndefined();
    expect(byId('settings-users')?.permission).toBe('users.view');
    expect(byId('settings-permissions')?.permission).toBe('roles.view');
    expect(byId('settings-social')?.permission).toBe('site_settings.view');
    expect(byId('support')?.permission).toBeUndefined();
    expect(byId('support-terms')?.permission).toBe('help_support.view');
    expect(byId('support-privacy')?.permission).toBe('help_support.view');
    expect(byId('support-faq')?.permission).toBe('help_support.view');
    expect(byId('seo')?.permission).toBe('seo.view');
  });
});
