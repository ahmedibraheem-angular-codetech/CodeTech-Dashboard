import type { LocaleText } from './social-links.model';

export interface SiteLogo {
  uuid: string | null;
  name: string | null;
  url: string | null;
}

export interface SiteSettings {
  description: LocaleText;
  companyName: LocaleText;
  websiteUrl: string;
  phone: string;
  email: string;
  locationName: LocaleText;
  mapUrl: string;
  logo: SiteLogo;
  updatedAt: string;
}

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
