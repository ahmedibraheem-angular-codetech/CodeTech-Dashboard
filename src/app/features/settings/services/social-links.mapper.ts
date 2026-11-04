import type {
  SocialLinkDto,
  SocialLinkWriteDto,
  SocialPlatformApiId,
} from '../models/social-links.api';
import type {
  SocialChannel,
  SocialChannelDraft,
  SocialPlatformId,
  SocialPublishStatus,
} from '../models/social-links.model';

/** Confirmed OpenAPI enum: `x` is the Twitter/X platform. */
export function toApiPlatform(platform: SocialPlatformId): SocialPlatformApiId {
  return platform === 'twitter' ? 'x' : platform;
}

export function fromApiPlatform(platform: string): SocialPlatformId {
  if (platform === 'x' || platform === 'twitter') {
    return 'twitter';
  }
  return platform as SocialPlatformId;
}

export function statusFromPublished(published: boolean): SocialPublishStatus {
  return published ? 'published' : 'draft';
}

export function publishedFromStatus(status: SocialPublishStatus): boolean {
  return status === 'published';
}

export function mapSocialLink(dto: SocialLinkDto): SocialChannel {
  const published = !!dto.is_published;
  return {
    id: String(dto.id),
    platform: fromApiPlatform(dto.platform),
    enabled: published,
    status: statusFromPublished(published),
    url: typeof dto.url === 'string' ? dto.url : '',
    sortOrder: typeof dto.sort_order === 'number' ? dto.sort_order : 0,
  };
}

export function toSocialLinkWrite(draft: SocialChannelDraft): SocialLinkWriteDto {
  return {
    platform: toApiPlatform(draft.platform),
    url: draft.url.trim(),
    is_published: publishedFromStatus(draft.status),
  };
}
