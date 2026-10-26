import type { AppLanguage } from '../../../core/i18n/language';

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
  avatarUrl: string;
  mediaUrl: string;
  mediaKind: 'video' | 'image';
  createdAt: string;
  createdTime: string;
  texts: Record<AppLanguage, ReviewText>;
}

export type ReviewStatusFilter = 'all' | ReviewPublishStatus;
