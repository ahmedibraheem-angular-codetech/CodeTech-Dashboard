import type {
  PermissionCatalogActionDto,
  PermissionCatalogDto,
  PermissionCatalogModuleDto,
  RoleDetailDto,
  RoleSummaryDto,
} from './permissions.api';

export interface CatalogAction {
  key: string;
  label: string;
}

export interface CatalogModule {
  key: string;
  label: string;
  /** Action keys this module supports. Never inferred beyond the catalog. */
  actions: readonly string[];
}

export interface PermissionCatalog {
  modules: CatalogModule[];
  actions: CatalogAction[];
}

export interface PermissionRole {
  id: string;
  name: string;
  isProtected: boolean;
  usersCount: number;
  /** Null on list rows until the detail request fills them. */
  permissions: readonly string[] | null;
}

export type PermissionGrants = Record<string, Record<string, boolean>>;

const ACTION_ORDER = ['view', 'create', 'update', 'delete'] as const;

export function mapPermissionCatalog(dto: PermissionCatalogDto): PermissionCatalog {
  const actions = sortCatalogActions(
    (dto.actions ?? [])
      .filter((action): action is PermissionCatalogActionDto => Boolean(action?.key?.trim()))
      .map((action) => ({ key: action.key.trim(), label: action.label ?? '' })),
  );
  const actionKeys = actions.map((action) => action.key);
  const known = new Set(actionKeys);
  const modules = (dto.modules ?? [])
    .filter((mod): mod is PermissionCatalogModuleDto => Boolean(mod?.key?.trim()))
    .map((mod) => ({
      key: mod.key.trim(),
      label: mod.label?.trim() || mod.key.trim(),
      actions: supportedActions(mod, actionKeys, known),
    }));
  return { modules, actions };
}

function sortCatalogActions(actions: CatalogAction[]): CatalogAction[] {
  const rank = new Map<string, number>(ACTION_ORDER.map((key, index) => [key, index]));
  return [...actions].sort((left, right) => {
    const leftRank = rank.get(left.key) ?? ACTION_ORDER.length;
    const rightRank = rank.get(right.key) ?? ACTION_ORDER.length;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return left.key.localeCompare(right.key);
  });
}

export function mapRoleSummary(dto: RoleSummaryDto): PermissionRole {
  return {
    id: String(dto.id),
    name: dto.name,
    isProtected: dto.is_protected === true,
    usersCount: Number.isFinite(dto.users_count) ? dto.users_count : 0,
    permissions: null,
  };
}

export function mapRoleDetail(dto: RoleDetailDto): PermissionRole {
  return {
    ...mapRoleSummary(dto),
    permissions: Array.isArray(dto.permissions)
      ? dto.permissions.filter((name) => typeof name === 'string')
      : [],
  };
}

export function grantsFromPermissions(
  catalog: PermissionCatalog,
  permissions: readonly string[],
): PermissionGrants {
  const held = new Set(permissions);
  const grants: PermissionGrants = {};
  for (const mod of catalog.modules) {
    grants[mod.key] = {};
    for (const action of mod.actions) {
      grants[mod.key][action] = held.has(permissionName(mod.key, action));
    }
  }
  return grants;
}

/** Names the matrix can edit. Unsupported pairs are omitted, never invented. */
export function permissionsFromGrants(
  catalog: PermissionCatalog,
  grants: PermissionGrants,
  preserved: readonly string[] = [],
): string[] {
  const names = new Set<string>();
  for (const mod of catalog.modules) {
    for (const action of mod.actions) {
      if (grants[mod.key]?.[action]) {
        names.add(permissionName(mod.key, action));
      }
    }
  }
  for (const name of preserved) {
    if (!catalogCovers(catalog, name)) {
      names.add(name);
    }
  }
  return [...names].sort();
}

/** Create-dialog module switch: every action that module supports, and no others. */
export function permissionsFromModuleToggles(
  catalog: PermissionCatalog,
  toggles: Readonly<Record<string, boolean>>,
): string[] {
  const names: string[] = [];
  for (const mod of catalog.modules) {
    if (!toggles[mod.key]) {
      continue;
    }
    for (const action of mod.actions) {
      names.push(permissionName(mod.key, action));
    }
  }
  return names.sort();
}

export function preservedPermissions(
  catalog: PermissionCatalog,
  permissions: readonly string[],
): string[] {
  return permissions.filter((name) => !catalogCovers(catalog, name));
}

export function permissionName(moduleKey: string, actionKey: string): string {
  return `${moduleKey}.${actionKey}`;
}

export function catalogCovers(catalog: PermissionCatalog, name: string): boolean {
  const split = name.indexOf('.');
  if (split <= 0) {
    return false;
  }
  const moduleKey = name.slice(0, split);
  const actionKey = name.slice(split + 1);
  const mod = catalog.modules.find((item) => item.key === moduleKey);
  return !!mod && mod.actions.includes(actionKey);
}

function supportedActions(
  mod: PermissionCatalogModuleDto,
  actionKeys: readonly string[],
  known: ReadonlySet<string>,
): string[] {
  const keys = Array.isArray(mod.actions)
    ? mod.actions.filter((key) => known.has(key))
    : [...actionKeys];
  const rank = new Map<string, number>(ACTION_ORDER.map((key, index) => [key, index]));
  return [...keys].sort((left, right) => {
    const leftRank = rank.get(left) ?? ACTION_ORDER.length;
    const rightRank = rank.get(right) ?? ACTION_ORDER.length;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return left.localeCompare(right);
  });
}
