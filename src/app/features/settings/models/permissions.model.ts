export type PermissionAction = 'create' | 'update' | 'remove';

export interface PermissionResource {
  id: string;
  labelKey: string;
  groupKey?: string;
}

/** Modules shown as single toggles in the add-role dialog (Figma grid). */
export interface PermissionModule {
  id: string;
  labelKey: string;
  /** Matrix resource ids this module toggle drives. */
  resourceIds: readonly string[];
}

export interface PermissionRole {
  id: string;
  labelKey?: string;
  name?: string;
  grants: Record<string, Record<PermissionAction, boolean>>;
}

export const PERMISSION_RESOURCES: readonly PermissionResource[] = [
  { id: 'home', labelKey: 'nav.home' },
  { id: 'about', labelKey: 'nav.about' },
  { id: 'inquiries', labelKey: 'nav.inquiries', groupKey: 'nav.contact' },
  { id: 'start', labelKey: 'nav.startProjects', groupKey: 'nav.contact' },
  { id: 'products', labelKey: 'nav.products' },
  { id: 'projects', labelKey: 'nav.projects' },
  { id: 'knowledge', labelKey: 'nav.knowledge' },
  { id: 'reviews', labelKey: 'nav.reviews' },
  { id: 'settings', labelKey: 'nav.settings' },
  { id: 'support', labelKey: 'nav.support' },
  { id: 'seo', labelKey: 'nav.seo' },
];

/** 10-card create modal grid matching the reference (طلبات التواصل as one card). */
export const PERMISSION_MODULES: readonly PermissionModule[] = [
  { id: 'home', labelKey: 'nav.home', resourceIds: ['home'] },
  { id: 'about', labelKey: 'nav.about', resourceIds: ['about'] },
  { id: 'contact', labelKey: 'nav.contact', resourceIds: ['inquiries', 'start'] },
  { id: 'products', labelKey: 'nav.products', resourceIds: ['products'] },
  { id: 'projects', labelKey: 'nav.projects', resourceIds: ['projects'] },
  { id: 'knowledge', labelKey: 'nav.knowledge', resourceIds: ['knowledge'] },
  { id: 'reviews', labelKey: 'nav.reviews', resourceIds: ['reviews'] },
  { id: 'settings', labelKey: 'nav.settings', resourceIds: ['settings'] },
  { id: 'support', labelKey: 'nav.support', resourceIds: ['support'] },
  { id: 'seo', labelKey: 'nav.seo', resourceIds: ['seo'] },
];

export const PERMISSION_ACTIONS: readonly PermissionAction[] = ['create', 'update', 'remove'];

/** Seed matching the add-role reference toggles. */
export const PERMISSION_DRAFT_SEED: Readonly<Record<string, boolean>> = {
  home: true,
  about: true,
  contact: true,
  products: false,
  projects: false,
  knowledge: true,
  reviews: true,
  settings: false,
  support: true,
  seo: false,
};

export function emptyPermissionGrants(): Record<string, Record<PermissionAction, boolean>> {
  return Object.fromEntries(
    PERMISSION_RESOURCES.map((resource) => [
      resource.id,
      { create: false, update: false, remove: false },
    ]),
  );
}

export function permissionGrants(
  flags: Readonly<Record<string, readonly [boolean, boolean, boolean]>>,
): Record<string, Record<PermissionAction, boolean>> {
  const next = emptyPermissionGrants();
  for (const [id, [create, update, remove]] of Object.entries(flags)) {
    next[id] = { create, update, remove };
  }
  return next;
}

export function permissionGrantsFromModules(
  modules: Readonly<Record<string, boolean>>,
): Record<string, Record<PermissionAction, boolean>> {
  const next = emptyPermissionGrants();
  for (const mod of PERMISSION_MODULES) {
    const on = modules[mod.id] ?? false;
    for (const resourceId of mod.resourceIds) {
      next[resourceId] = { create: on, update: on, remove: on };
    }
  }
  return next;
}
