import type { LocaleText } from './social-links.model';

/** Domain model for site details (loaded/saved independently of social channels). */
export interface SiteLogo {
  uuid: string | null;
  name: string | null;
  url: string | null;
}

export interface SiteSettings {
  description: LocaleText;
  /** Preserved on save even when the current layout has no company field. */
  companyName: LocaleText;
  /** Preserved on save even when the current layout has no website field. */
  websiteUrl: string;
  phone: string;
  email: string;
  locationName: LocaleText;
  mapUrl: string;
  logo: SiteLogo;
  updatedAt: string;
}

/** Coat-check logo intent for PUT `/admin/site-settings`. */
export type SiteLogoIntent = { kind: 'omit' } | { kind: 'clear' } | { kind: 'replace'; file: File };

export interface SiteSettingsDraft {
  description: LocaleText;
  companyName: LocaleText;
  websiteUrl: string;
  phone: string;
  email: string;
  locationName: LocaleText;
  mapUrl: string;
  logo: SiteLogoIntent;
}
