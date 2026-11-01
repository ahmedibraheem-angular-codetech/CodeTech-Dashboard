import type { AppLanguage } from '../../../core/i18n/language';
import { type UploadedImageMeta } from '../../../shared/utils/image-upload';

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

export interface BlockImage extends UploadedImageMeta {
  uuid?: string;
  url?: string;
  downloadUrl?: string;
  file?: File;
}

export interface ContentBlock {
  texts: Record<AppLanguage, ContentBlockText>;
  image: BlockImage | null;
}

export const HOME_VIDEO_MAX_BYTES = 20 * 1024 * 1024;

export interface HomepageContent {
  partners: Partner[];
  videoEnabled: boolean;
  videoName: string | null;
  videoUrl: string | null;
  about: ContentBlock;
  vision: ContentBlock;
}
