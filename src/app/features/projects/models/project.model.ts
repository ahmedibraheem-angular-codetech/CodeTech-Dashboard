import type { AppLanguage } from '../../../core/i18n/language';
import { IDENTITY_IMAGE_SLOTS } from '../constants/project-limits';

export interface LocaleText {
  ar: string;
  en: string;
}

export function readLocale(value: LocaleText, language: AppLanguage): string {
  return value[language];
}

export function localeText(ar = '', en = ''): LocaleText {
  return { ar, en };
}

export interface ProjectImage {
  imageName: string;
  imageUrl: string;
  /** Media coat-check UUID when known from the API or a fresh upload. */
  imageUuid?: string | null;
}

/** Per-locale media slots used in the project editor (AR/EN tabs). */
export type LocalizedMedia = Record<AppLanguage, ProjectImage>;

export function emptyProjectImage(): ProjectImage {
  return { imageName: '', imageUrl: '', imageUuid: null };
}

export function emptyLocalizedMedia(): LocalizedMedia {
  return { ar: emptyProjectImage(), en: emptyProjectImage() };
}

/**
 * Active-locale media with Arabic fallback (matches website behavior when EN is empty).
 */
export function readMedia(image: LocalizedMedia, language: AppLanguage): ProjectImage {
  const current = image[language];
  if (current.imageUrl) {
    return current;
  }
  return image.ar.imageUrl ? image.ar : current;
}

export interface ProjectPoint {
  id: string;
  title: LocaleText;
  body: LocaleText;
  image: LocalizedMedia;
}

export interface ProjectMedia {
  id: string;
  title: LocaleText;
  body: LocaleText;
  image: LocalizedMedia;
}

export interface ProjectGalleryImage {
  id: string;
  image: LocalizedMedia;
}

export interface ProjectIdentityButton {
  id: string;
  title: LocaleText;
  body: LocaleText;
  images: ProjectGalleryImage[];
}

export interface ProjectSeo {
  slug: LocaleText;
  title: LocaleText;
  keywords: LocaleText;
  description: LocaleText;
}

export interface Project {
  id: string;
  code: string;
  published: boolean;
  name: LocaleText;
  summary: LocaleText;
  /** Cover image per editor locale. API still stores one shared cover file. */
  cover: LocalizedMedia;
  coverTitle: LocaleText;
  coverAlt: LocaleText;
  /** Thumbnail per editor locale. API still stores one shared thumbnail file. */
  thumb: LocalizedMedia;
  thumbTitle: LocaleText;
  thumbAlt: LocaleText;

  categories: ProjectPoint[];

  aboutCards: ProjectPoint[];

  challenges: ProjectPoint[];

  tools: ProjectMedia[];

  solutions: ProjectPoint[];

  solutionsImage: ProjectMedia;

  gallery: ProjectGalleryImage[];

  features: ProjectPoint[];

  results: ProjectPoint[];

  identityButtons: ProjectIdentityButton[];

  seo: ProjectSeo;
}

let sequence = 0;

export function projectId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

export function projectPoint(title = localeText(), body = localeText()): ProjectPoint {
  return { id: projectId('point'), title, body, image: emptyLocalizedMedia() };
}

export function projectMedia(): ProjectMedia {
  return {
    id: projectId('media'),
    title: localeText(),
    body: localeText(),
    image: emptyLocalizedMedia(),
  };
}

export function projectGalleryImage(): ProjectGalleryImage {
  return { id: projectId('gallery'), image: emptyLocalizedMedia() };
}

export function projectIdentityButton(
  title = localeText(),
  body = localeText(),
): ProjectIdentityButton {
  return {
    id: projectId('identity'),
    title,
    body,
    images: Array.from({ length: IDENTITY_IMAGE_SLOTS }, () => projectGalleryImage()),
  };
}

export function blankProject(): Project {
  return {
    id: '',
    code: '',
    published: true,
    name: localeText(),
    summary: localeText(),
    cover: emptyLocalizedMedia(),
    coverTitle: localeText(),
    coverAlt: localeText(),
    thumb: emptyLocalizedMedia(),
    thumbTitle: localeText(),
    thumbAlt: localeText(),
    categories: [projectPoint()],
    aboutCards: [projectPoint()],
    challenges: [projectPoint()],
    tools: [projectMedia()],
    solutions: [projectPoint()],
    solutionsImage: projectMedia(),
    gallery: [projectGalleryImage()],
    features: [projectPoint()],
    results: [projectPoint()],
    identityButtons: [projectIdentityButton()],
    seo: {
      slug: localeText(),
      title: localeText(),
      keywords: localeText(),
      description: localeText(),
    },
  };
}
