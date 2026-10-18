import type { AppLanguage } from '../../../core/i18n/language';

export interface Partner {
  id: string;
  name: string;
  monogram: string;
  image: BlockImage | null;
}

export interface ContentBlockText {
  title: string;
  body: string;
  points: string[];
}

export interface BlockImage {
  name: string;
  size: number;
  uploadedAt: string;
}

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
