import type { AppLanguage } from '../../../core/i18n/language';

export type ReviewPublishStatus = 'published' | 'unpublished';

export interface ReviewText {
  name: string;
  role: string;
  quote: string;
}

export interface ReviewMediaFile {
  uuid: string;
  url: string;
  name: string;
  fileName: string;
  size: number;
}

export interface Review {
  id: string;

  externalId: string;
  rating: number;
  published: boolean;
  photo: ReviewMediaFile | null;
  video: ReviewMediaFile | null;
  createdAt: string;
  sortOrder: number;
  texts: Record<AppLanguage, ReviewText>;
}

export interface ReviewContentDraft {
  rating: number;
  published: boolean;
  texts: Record<AppLanguage, ReviewText>;
}

/**
 * Media write intent per coat-check rules:
 * - `omit` → do not send the field (keep existing)
 * - `clear` → send `null` (remove)
 * - `replace` → upload File then send UUID
 */
export type ReviewMediaIntent =
  | { kind: 'omit' }
  | { kind: 'clear' }
  | { kind: 'replace'; file: File };

export interface ReviewMediaDraft {
  photo: ReviewMediaIntent;
  video: ReviewMediaIntent;
}

export type ReviewStatusFilter = 'all' | ReviewPublishStatus;

export const REVIEW_AVATAR_PLACEHOLDER = 'images/avatar-placeholder.svg';
