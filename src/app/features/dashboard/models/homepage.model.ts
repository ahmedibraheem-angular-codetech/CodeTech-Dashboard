import type { AppLanguage } from '../../../core/i18n/language';
import {
  IMAGE_UPLOAD_MAX_BYTES,
  IMAGE_UPLOAD_TYPES,
  type UploadedImageMeta,
} from '../../../shared/utils/image-upload';

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

export type BlockImage = UploadedImageMeta;

export interface ContentBlock {
  texts: Record<AppLanguage, ContentBlockText>;
  image: BlockImage | null;
}

export const BLOCK_IMAGE_TYPES = IMAGE_UPLOAD_TYPES;
export const BLOCK_IMAGE_MAX_BYTES = IMAGE_UPLOAD_MAX_BYTES;

export interface HomepageContent {
  partners: Partner[];
  videoEnabled: boolean;
  videoName: string | null;
  contactRequests: number;
  about: ContentBlock;
  vision: ContentBlock;
}
