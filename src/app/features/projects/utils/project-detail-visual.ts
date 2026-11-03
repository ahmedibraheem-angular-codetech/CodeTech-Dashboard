import type { AppLanguage } from '../../../core/i18n/language';
import {
  readMedia,
  type LocalizedMedia,
  type ProjectImage,
  type ProjectMedia,
  type ProjectPoint,
} from '../models/project.model';

const ICON_CLASS = /^pi-[a-z0-9-]+$/;

export interface ProjectPointVisual {
  icon: string;
  image: string;
}

export function usableProjectImage(url: string): boolean {
  return url.length > 0 && !url.startsWith('icon:');
}

export function projectPointVisual(
  entry: { image: LocalizedMedia } | ProjectPoint | ProjectMedia,
  language: AppLanguage = 'ar',
): ProjectPointVisual {
  const media = readMedia(entry.image, language);
  return projectImageVisual(media);
}

export function projectImageVisual(media: ProjectImage): ProjectPointVisual {
  const url = media.imageUrl;
  if (!url) {
    return { icon: '', image: '' };
  }
  if (url.startsWith('icon:')) {
    const icon = url.slice('icon:'.length);
    return { icon: ICON_CLASS.test(icon) ? icon : '', image: '' };
  }
  return { icon: '', image: url };
}
