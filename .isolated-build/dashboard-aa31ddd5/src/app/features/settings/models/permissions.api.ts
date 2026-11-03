export interface PermissionCatalogModuleDto {
  key: string;
  label: string;
  /** Present only when this module does not support every catalog action. */
  actions?: string[];
}

export interface PermissionCatalogActionDto {
  key: string;
  label: string;
}

export interface PermissionCatalogDto {
  modules: PermissionCatalogModuleDto[];
  actions: PermissionCatalogActionDto[];
}

export interface RoleSummaryDto {
  id: number;
  name: string;
  is_protected: boolean;
  users_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface RoleDetailDto extends RoleSummaryDto {
  permissions: string[];
}

export interface RoleWriteDto {
  name: string;
  permissions: string[];
}
