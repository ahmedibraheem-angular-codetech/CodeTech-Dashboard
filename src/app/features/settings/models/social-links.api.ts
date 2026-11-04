/** Wire DTOs for `/admin/social-links` (OpenAPI Settings › social links). */

export type SocialPlatformApiId =
  'linkedin' | 'facebook' | 'instagram' | 'x' | 'tiktok' | 'snapchat' | 'whatsapp';

export interface SocialLinkDto {
  id: number;
  platform: SocialPlatformApiId;
  url: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SocialLinkWriteDto {
  platform: SocialPlatformApiId;
  url: string;
  is_published: boolean;
}

export interface SocialLinkPublishWriteDto {
  is_published: boolean;
}

export interface SocialLinkReorderWriteDto {
  ids: number[];
}
