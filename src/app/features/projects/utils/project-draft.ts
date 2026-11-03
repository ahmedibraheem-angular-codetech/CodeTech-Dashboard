import type { AppLanguage } from '../../../core/i18n/language';
import {
  projectGalleryImage,
  projectIdentityButton,
  projectMedia,
  projectPoint,
  type LocaleText,
  type Project,
} from '../models/project.model';

export type ProjectPointList =
  'categories' | 'aboutCards' | 'challenges' | 'solutions' | 'features' | 'results';

export type ProjectMediaList = 'tools';

export type ProjectUploadFile = { name: string; url: string };

export function writeLocaleText(
  current: LocaleText,
  language: AppLanguage,
  value: string,
): LocaleText {
  return { ...current, [language]: value };
}

export function mapAtIndex<T>(items: readonly T[], index: number, update: (item: T) => T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? update(item) : item));
}

export function patchItemLocaleField<T extends Record<K, LocaleText>, K extends keyof T>(
  items: readonly T[],
  index: number,
  field: K,
  language: AppLanguage,
  value: string,
): T[] {
  return mapAtIndex(items, index, (item) => ({
    ...item,
    [field]: writeLocaleText(item[field], language, value),
  }));
}

export function withProjectImage<
  T extends { imageName: string; imageUrl: string; imageUuid?: string | null },
>(item: T, file: ProjectUploadFile): T {
  return { ...item, imageName: file.name, imageUrl: file.url, imageUuid: null };
}

export function withoutProjectImage<
  T extends { imageName: string; imageUrl: string; imageUuid?: string | null },
>(item: T): T {
  return { ...item, imageName: '', imageUrl: '', imageUuid: null };
}

export function removeKeepingMinOne<T>(items: readonly T[], index: number): T[] {
  return items.length > 1 ? items.filter((_, item) => item !== index) : [...items];
}

export function draftSetLocaleField(
  project: Project,
  key: 'name' | 'summary',
  language: AppLanguage,
  value: string,
): Project {
  return { ...project, [key]: writeLocaleText(project[key], language, value) };
}

export function draftSetPointField(
  project: Project,
  list: ProjectPointList,
  index: number,
  field: 'title' | 'body',
  language: AppLanguage,
  value: string,
): Project {
  return {
    ...project,
    [list]: patchItemLocaleField(project[list], index, field, language, value),
  };
}

export function draftAddPoint(project: Project, list: ProjectPointList): Project {
  return { ...project, [list]: [...project[list], projectPoint()] };
}

export function draftRemovePoint(project: Project, list: ProjectPointList, index: number): Project {
  return { ...project, [list]: removeKeepingMinOne(project[list], index) };
}

export function draftSetPointImage(
  project: Project,
  list: ProjectPointList,
  index: number,
  file: ProjectUploadFile,
): Project {
  return {
    ...project,
    [list]: mapAtIndex(project[list], index, (item) => withProjectImage(item, file)),
  };
}

export function draftClearPointImage(
  project: Project,
  list: ProjectPointList,
  index: number,
): Project {
  return {
    ...project,
    [list]: mapAtIndex(project[list], index, (item) => withoutProjectImage(item)),
  };
}

export function draftSetMediaImage(
  project: Project,
  list: ProjectMediaList,
  index: number,
  file: ProjectUploadFile,
): Project {
  return {
    ...project,
    [list]: mapAtIndex(project[list], index, (item) => withProjectImage(item, file)),
  };
}

export function draftClearMediaImage(
  project: Project,
  list: ProjectMediaList,
  index: number,
): Project {
  return {
    ...project,
    [list]: mapAtIndex(project[list], index, (item) => withoutProjectImage(item)),
  };
}

export function draftAddMedia(project: Project, list: ProjectMediaList): Project {
  return { ...project, [list]: [...project[list], projectMedia()] };
}

export function draftRemoveMedia(project: Project, list: ProjectMediaList, index: number): Project {
  return { ...project, [list]: removeKeepingMinOne(project[list], index) };
}

export function draftSetCover(
  project: Project,
  kind: 'cover' | 'thumb',
  file: ProjectUploadFile,
): Project {
  return kind === 'cover'
    ? { ...project, coverName: file.name, coverUrl: file.url, coverUuid: null }
    : { ...project, thumbName: file.name, thumbUrl: file.url, thumbUuid: null };
}

export function draftClearCover(project: Project, kind: 'cover' | 'thumb'): Project {
  return kind === 'cover'
    ? { ...project, coverName: '', coverUrl: '', coverUuid: null }
    : { ...project, thumbName: '', thumbUrl: '', thumbUuid: null };
}

export function draftSetCoverText(
  project: Project,
  key: 'coverTitle' | 'coverAlt' | 'thumbTitle' | 'thumbAlt',
  language: AppLanguage,
  value: string,
): Project {
  return { ...project, [key]: writeLocaleText(project[key], language, value) };
}

export function draftSetSolutionsImage(project: Project, file: ProjectUploadFile): Project {
  return { ...project, solutionsImage: withProjectImage(project.solutionsImage, file) };
}

export function draftClearSolutionsImage(project: Project): Project {
  return { ...project, solutionsImage: withoutProjectImage(project.solutionsImage) };
}

export function draftSetSolutionsImageText(
  project: Project,
  field: 'title' | 'body',
  language: AppLanguage,
  value: string,
): Project {
  return {
    ...project,
    solutionsImage: {
      ...project.solutionsImage,
      [field]: writeLocaleText(project.solutionsImage[field], language, value),
    },
  };
}

export function draftSetGalleryImage(
  project: Project,
  index: number,
  file: ProjectUploadFile,
): Project {
  return {
    ...project,
    gallery: mapAtIndex(project.gallery, index, (item) => withProjectImage(item, file)),
  };
}

export function draftClearGalleryImage(project: Project, index: number): Project {
  return {
    ...project,
    gallery: mapAtIndex(project.gallery, index, (item) => withoutProjectImage(item)),
  };
}

export function draftAddGallery(project: Project): Project {
  return { ...project, gallery: [...project.gallery, projectGalleryImage()] };
}

export function draftRemoveGallery(project: Project, index: number): Project {
  return { ...project, gallery: removeKeepingMinOne(project.gallery, index) };
}

export function draftSetIdentityButtonText(
  project: Project,
  index: number,
  field: 'title' | 'body',
  language: AppLanguage,
  value: string,
): Project {
  return {
    ...project,
    identityButtons: patchItemLocaleField(project.identityButtons, index, field, language, value),
  };
}

export function draftAddIdentityButton(project: Project): Project {
  return {
    ...project,
    identityButtons: [...project.identityButtons, projectIdentityButton()],
  };
}

export function draftRemoveIdentityButton(project: Project, index: number): Project {
  return {
    ...project,
    identityButtons: removeKeepingMinOne(project.identityButtons, index),
  };
}

export function draftSetIdentityButtonImage(
  project: Project,
  buttonIndex: number,
  imageIndex: number,
  file: ProjectUploadFile,
): Project {
  return {
    ...project,
    identityButtons: mapAtIndex(project.identityButtons, buttonIndex, (button) => ({
      ...button,
      images: mapAtIndex(button.images, imageIndex, (image) => withProjectImage(image, file)),
    })),
  };
}

export function draftClearIdentityButtonImage(
  project: Project,
  buttonIndex: number,
  imageIndex: number,
): Project {
  return {
    ...project,
    identityButtons: mapAtIndex(project.identityButtons, buttonIndex, (button) => ({
      ...button,
      images: mapAtIndex(button.images, imageIndex, (image) => withoutProjectImage(image)),
    })),
  };
}

export function draftSetSeo(
  project: Project,
  field: keyof Project['seo'],
  language: AppLanguage,
  value: string,
): Project {
  return {
    ...project,
    seo: { ...project.seo, [field]: writeLocaleText(project.seo[field], language, value) },
  };
}
