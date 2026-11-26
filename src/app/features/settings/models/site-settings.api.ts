import type { FileObject } from '../../../core/http/api.model';

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
