import type { AppLanguage } from '../../../core/i18n/language';

export type SocialPlatformId =
  'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'snapchat' | 'whatsapp';

export type SocialPublishStatus = 'published' | 'draft';

export interface LocaleText {
  ar: string;
  en: string;
}

export interface SocialChannel {
  id: string;
  platform: SocialPlatformId;
  enabled: boolean;
  status: SocialPublishStatus;
  url: LocaleText;
}

export interface SocialSiteDetails {
  description: LocaleText;
  phone: string;
  email: string;
  imageName: string | null;
  imageUrl: string | null;
}

export interface SocialLocation {
  name: LocaleText;
  mapUrl: string;
}

export interface SocialLinksDocument {
  site: SocialSiteDetails;
  location: SocialLocation;
  channels: SocialChannel[];
  updatedAt: string;
}

export interface SocialChannelDraft {
  platform: SocialPlatformId;
  status: SocialPublishStatus;
  url: LocaleText;
}

export const SOCIAL_PLATFORMS: readonly SocialPlatformId[] = [
  'linkedin',
  'facebook',
  'instagram',
  'twitter',
  'tiktok',
  'snapchat',
  'whatsapp',
] as const;

export function emptyLocaleText(): LocaleText {
  return { ar: '', en: '' };
}

export function readLocale(value: LocaleText, locale: AppLanguage): string {
  return value[locale] || value.ar || value.en;
}
