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
  url: string;
  sortOrder: number;
}

export interface SocialChannelDraft {
  platform: SocialPlatformId;
  status: SocialPublishStatus;
  url: string;
}

export const SOCIAL_PLATFORM_IDS: readonly SocialPlatformId[] = [
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

export function availableSocialPlatforms(
  channels: readonly SocialChannel[],
  excludeId?: string,
): SocialPlatformId[] {
  const used = new Set(
    channels.filter((item) => item.id !== excludeId).map((item) => item.platform),
  );
  return SOCIAL_PLATFORM_IDS.filter((platform) => !used.has(platform));
}
