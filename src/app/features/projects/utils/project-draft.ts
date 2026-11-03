import type { AppLanguage } from '../../../core/i18n/language';
import {
  projectGalleryImage,
  projectIdentityButton,
  projectMedia,
  projectPoint,
  type LocaleText,
  type LocalizedMedia,
  type Project,
  type ProjectImage,
} from '../models/project.model';

export type ProjectPointList =
  'categories' | 'aboutCards' | 'challenges' | 'solutions' | 'features' | 'results';

export type ProjectMediaList = 'tools';

export interface ProjectUploadFile {
  name: string;
  url: string;
}

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

export function withProjectImage(item: ProjectImage, file: ProjectUploadFile): ProjectImage {
  return { imageName: file.name, imageUrl: file.url, imageUuid: null };
}

export function withoutProjectImage(item: ProjectImage): ProjectImage {
  return { ...item, imageName: '', imageUrl: '', imageUuid: null };
}

export function removeKeepingMinOne<T>(items: readonly T[], index: number): T[] {
  return items.length > 1 ? items.filter((_, item) => item !== index) : [...items];
}

export function setLocalizedSlotImage<T extends { image: LocalizedMedia }>(
  items: readonly T[],
  index: number,
  language: AppLanguage,
  file: ProjectUploadFile,
): T[] {
  return mapAtIndex(items, index, (item) => ({
    ...item,
    image: { ...item.image, [language]: withProjectImage(item.image[language], file) },
  }));
}

export function clearLocalizedSlotImage<T extends { image: LocalizedMedia }>(
  items: readonly T[],
  index: number,
  language: AppLanguage,
): T[] {
  return mapAtIndex(items, index, (item) => ({
    ...item,
    image: { ...item.image, [language]: withoutProjectImage(item.image[language]) },
  }));
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
  language: AppLanguage,
  file: ProjectUploadFile,
): Project {
  return { ...project, [list]: setLocalizedSlotImage(project[list], index, language, file) };
}

export function draftClearPointImage(
  project: Project,
  list: ProjectPointList,
  index: number,
  language: AppLanguage,
): Project {
  return { ...project, [list]: clearLocalizedSlotImage(project[list], index, language) };
}

export function draftSetMediaImage(
  project: Project,
  list: ProjectMediaList,
  index: number,
  language: AppLanguage,
  file: ProjectUploadFile,
): Project {
  return { ...project, [list]: setLocalizedSlotImage(project[list], index, language, file) };
}

export function draftClearMediaImage(
  project: Project,
  list: ProjectMediaList,
  index: number,
  language: AppLanguage,
): Project {
  return { ...project, [list]: clearLocalizedSlotImage(project[list], index, language) };
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
  language: AppLanguage,
  file: ProjectUploadFile,
): Project {
  const slot = kind === 'cover' ? project.cover : project.thumb;
  const next = {
    ...slot,
    [language]: withProjectImage(slot[language], file),
  };
  return kind === 'cover' ? { ...project, cover: next } : { ...project, thumb: next };
}

export function draftClearCover(
  project: Project,
  kind: 'cover' | 'thumb',
  language: AppLanguage,
): Project {
  const slot = kind === 'cover' ? project.cover : project.thumb;
  const next = {
    ...slot,
    [language]: withoutProjectImage(slot[language]),
  };
  return kind === 'cover' ? { ...project, cover: next } : { ...project, thumb: next };
}

export function draftSetCoverText(
  project: Project,
  key: 'coverTitle' | 'coverAlt' | 'thumbTitle' | 'thumbAlt',
  language: AppLanguage,
  value: string,
): Project {
  return { ...project, [key]: writeLocaleText(project[key], language, value) };
}

export function draftSetSolutionsImage(
  project: Project,
  language: AppLanguage,
  file: ProjectUploadFile,
): Project {
  return {
    ...project,
    solutionsImage: {
      ...project.solutionsImage,
      image: {
        ...project.solutionsImage.image,
        [language]: withProjectImage(project.solutionsImage.image[language], file),
      },
    },
  };
}

export function draftClearSolutionsImage(project: Project, language: AppLanguage): Project {
  return {
    ...project,
    solutionsImage: {
      ...project.solutionsImage,
      image: {
        ...project.solutionsImage.image,
        [language]: withoutProjectImage(project.solutionsImage.image[language]),
      },
    },
  };
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
  language: AppLanguage,
  file: ProjectUploadFile,
): Project {
  return {
    ...project,
    gallery: setLocalizedSlotImage(project.gallery, index, language, file),
  };
}

export function draftClearGalleryImage(
  project: Project,
  index: number,
  language: AppLanguage,
): Project {
  return {
    ...project,
    gallery: clearLocalizedSlotImage(project.gallery, index, language),
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
  language: AppLanguage,
  file: ProjectUploadFile,
): Project {
  return {
    ...project,
    identityButtons: mapAtIndex(project.identityButtons, buttonIndex, (button) => ({
      ...button,
      images: setLocalizedSlotImage(button.images, imageIndex, language, file),
    })),
  };
}

export function draftClearIdentityButtonImage(
  project: Project,
  buttonIndex: number,
  imageIndex: number,
  language: AppLanguage,
): Project {
  return {
    ...project,
    identityButtons: mapAtIndex(project.identityButtons, buttonIndex, (button) => ({
      ...button,
      images: clearLocalizedSlotImage(button.images, imageIndex, language),
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
