import type { AppLanguage } from '../../../core/i18n/language';

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

export interface ProjectPoint {
  id: string;
  title: LocaleText;
  body: LocaleText;
  imageName: string;
  imageUrl: string;
}

export interface ProjectMedia {
  id: string;
  title: LocaleText;
  body: LocaleText;
  imageName: string;
  imageUrl: string;
}

export interface ProjectGalleryImage {
  id: string;
  imageName: string;
  imageUrl: string;
}

export interface ProjectIdentityButton {
  id: string;
  title: LocaleText;
  body: LocaleText;
  images: ProjectGalleryImage[];
}

export const IDENTITY_IMAGE_SLOTS = 4;

export interface ProjectSeo {
  slug: LocaleText;
  title: LocaleText;
  keywords: LocaleText;
  description: LocaleText;
}

export interface Project {
  id: string;
  published: boolean;
  name: LocaleText;
  summary: LocaleText;
  coverName: string;
  coverUrl: string;
  coverTitle: LocaleText;
  coverAlt: LocaleText;
  thumbName: string;
  thumbUrl: string;
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

export const PROJECT_STEPS = [
  { id: 'about', labelKey: 'project.step.about' },
  { id: 'challenges', labelKey: 'project.step.challenges' },
  { id: 'solutions', labelKey: 'project.step.solutions' },
  { id: 'features', labelKey: 'project.step.features' },
  { id: 'results', labelKey: 'project.step.results' },
  { id: 'identity', labelKey: 'project.step.identity' },
  { id: 'seo', labelKey: 'project.step.seo' },
] as const;

export type ProjectStepId = (typeof PROJECT_STEPS)[number]['id'];

let sequence = 0;

export function projectId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

export function projectPoint(title = localeText(), body = localeText()): ProjectPoint {
  return { id: projectId('point'), title, body, imageName: '', imageUrl: '' };
}

export function projectMedia(): ProjectMedia {
  return {
    id: projectId('media'),
    title: localeText(),
    body: localeText(),
    imageName: '',
    imageUrl: '',
  };
}

export function projectGalleryImage(): ProjectGalleryImage {
  return { id: projectId('gallery'), imageName: '', imageUrl: '' };
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
    published: true,
    name: localeText(),
    summary: localeText(),
    coverName: '',
    coverUrl: '',
    coverTitle: localeText(),
    coverAlt: localeText(),
    thumbName: '',
    thumbUrl: '',
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
