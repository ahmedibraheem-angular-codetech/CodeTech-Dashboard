import type { AppLanguage } from '../../../core/i18n/language';
import type { LocalizedMedia, LocalizedMediaDraft } from '../../../core/media/localized-media';

export type ReviewPublishStatus = 'published' | 'unpublished';

export interface ReviewText {
  name: string;
  role: string;
  quote: string;
}

export interface Review {
  id: string;

  externalId: string;
  rating: number;
  published: boolean;
  photo: LocalizedMedia;
  video: LocalizedMedia;
  createdAt: string;
  sortOrder: number;
  texts: Record<AppLanguage, ReviewText>;
}

export interface ReviewContentDraft {
  rating: number;
  published: boolean;
  texts: Record<AppLanguage, ReviewText>;
}

export interface ReviewMediaDraft {
  photo: LocalizedMediaDraft;
  video: LocalizedMediaDraft;
}

export type ReviewStatusFilter = 'all' | ReviewPublishStatus;

export const REVIEW_AVATAR_PLACEHOLDER = 'images/avatar-placeholder.svg';
