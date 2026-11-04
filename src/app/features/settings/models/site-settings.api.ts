import type { FileObject } from '../../../core/http/api.model';

/** Wire DTOs for `/admin/site-settings` (OpenAPI Settings › site details). */

export interface SiteLocaleDto {
  ar: string | null;
  en: string | null;
}

export interface SiteSettingsUpdatedByDto {
  id: number;
  name: string;
}

export interface SiteSettingsDto {
  site_description: SiteLocaleDto | null;
  company_name: SiteLocaleDto | null;
  location_name: SiteLocaleDto | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  google_maps_url: string | null;
  logo: FileObject | null;
  updated_by: SiteSettingsUpdatedByDto | null;
  updated_at: string | null;
}

/**
 * PUT body. `logo` is the media UUID:
 * - omit → keep current logo
 * - `null` → remove logo
 * - string UUID → replace
 */
export interface SiteSettingsWriteDto {
  site_description?: SiteLocaleDto | null;
  company_name?: SiteLocaleDto | null;
  location_name?: SiteLocaleDto | null;
  phone?: string | null;
  email?: string | null;
  website_url?: string | null;
  google_maps_url?: string | null;
  logo?: string | null;
}
