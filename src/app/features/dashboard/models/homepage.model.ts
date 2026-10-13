import type { AppLanguage } from '../../../core/i18n/language';

export interface Partner {
  id: string;
  name: string;
  monogram: string;
  image: BlockImage | null;
}

/** One language of a story block. The number of points is free. */
export interface ContentBlockText {
  title: string;
  body: string;
  points: string[];
}

/** Metadata of the uploaded section image. `uploadedAt` is an ISO date (`yyyy-mm-dd`). */
export interface BlockImage {
  name: string;
  size: number;
  uploadedAt: string;
}

/** A story block is written in both languages and shares one image. */
export interface ContentBlock {
  texts: Record<AppLanguage, ContentBlockText>;
  image: BlockImage | null;
}

export const BLOCK_IMAGE_TYPES: readonly string[] = ['image/png', 'image/jpeg'];
export const BLOCK_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export interface HomepageContent {
  partners: Partner[];
  videoEnabled: boolean;
  videoName: string | null;
  contactRequests: number;
  about: ContentBlock;
  vision: ContentBlock;
}
