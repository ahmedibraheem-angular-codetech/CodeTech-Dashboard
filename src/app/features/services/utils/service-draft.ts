import type { AppLanguage } from '../../../core/i18n/language';
import {
  serviceFaq,
  servicePoint,
  serviceSector,
  serviceWhyItem,
  type LocaleText,
  type LocalizedMedia,
  type Service,
  type ServiceImage,
} from '../models/service.model';

export interface ServiceImageFile {
  name: string;
  url: string;
}

export type ServicePointList = 'solutions' | 'stages' | 'features';

export function writeLocale(current: LocaleText, language: AppLanguage, value: string): LocaleText {
  return { ...current, [language]: value };
}

export function mapAt<T>(items: readonly T[], index: number, update: (item: T) => T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? update(item) : item));
}

export function withoutAt<T>(items: readonly T[], index: number): T[] {
  return items.length > 1 ? items.filter((_, item) => item !== index) : [...items];
}

export function patchLocaleField<T extends Record<K, LocaleText>, K extends keyof T>(
  items: readonly T[],
  index: number,
  field: K,
  language: AppLanguage,
  value: string,
): T[] {
  return mapAt(items, index, (item) => ({
    ...item,
    [field]: writeLocale(item[field], language, value),
  }));
}

export function withImage(item: ServiceImage, file: ServiceImageFile): ServiceImage {
  return { imageName: file.name, imageUrl: file.url, imageUuid: null };
}

export function withoutImage(item: ServiceImage): ServiceImage {
  return { ...item, imageName: '', imageUrl: '', imageUuid: null };
}

export function setLocalizedSlotImage<T extends { image: LocalizedMedia }>(
  items: readonly T[],
  index: number,
  language: AppLanguage,
  file: ServiceImageFile,
): T[] {
  return mapAt(items, index, (item) => ({
    ...item,
    image: { ...item.image, [language]: withImage(item.image[language], file) },
  }));
}

export function clearLocalizedSlotImage<T extends { image: LocalizedMedia }>(
  items: readonly T[],
  index: number,
  language: AppLanguage,
): T[] {
  return mapAt(items, index, (item) => ({
    ...item,
    image: { ...item.image, [language]: withoutImage(item.image[language]) },
  }));
}

export function draftSetField(
  service: Service,
  key: 'name' | 'description',
  language: AppLanguage,
  value: string,
): Service {
  return { ...service, [key]: writeLocale(service[key], language, value) };
}

export function draftSetWhyImage(
  service: Service,
  language: AppLanguage,
  file: ServiceImageFile,
): Service {
  return {
    ...service,
    whyImage: {
      ...service.whyImage,
      image: {
        ...service.whyImage.image,
        [language]: withImage(service.whyImage.image[language], file),
      },
    },
  };
}

export function draftClearWhyImage(service: Service, language: AppLanguage): Service {
  return {
    ...service,
    whyImage: {
      ...service.whyImage,
      image: {
        ...service.whyImage.image,
        [language]: withoutImage(service.whyImage.image[language]),
      },
    },
  };
}

export function draftSetWhyImageTitle(
  service: Service,
  language: AppLanguage,
  value: string,
): Service {
  return {
    ...service,
    whyImage: {
      ...service.whyImage,
      title: writeLocale(service.whyImage.title, language, value),
    },
  };
}

export function draftSetWhyTitle(
  service: Service,
  index: number,
  language: AppLanguage,
  value: string,
): Service {
  return {
    ...service,
    whyItems: patchLocaleField(service.whyItems, index, 'title', language, value),
  };
}

export function draftSetWhyIcon(
  service: Service,
  index: number,
  language: AppLanguage,
  file: ServiceImageFile,
): Service {
  return {
    ...service,
    whyItems: setLocalizedSlotImage(service.whyItems, index, language, file),
  };
}

export function draftClearWhyIcon(service: Service, index: number, language: AppLanguage): Service {
  return {
    ...service,
    whyItems: clearLocalizedSlotImage(service.whyItems, index, language),
  };
}

export function draftAddWhy(service: Service): Service {
  return { ...service, whyItems: [...service.whyItems, serviceWhyItem()] };
}

export function draftRemoveWhy(service: Service, index: number): Service {
  return { ...service, whyItems: withoutAt(service.whyItems, index) };
}

export function draftSetPoint(
  service: Service,
  list: ServicePointList,
  index: number,
  field: 'title' | 'body',
  language: AppLanguage,
  value: string,
): Service {
  return {
    ...service,
    [list]: patchLocaleField(service[list], index, field, language, value),
  };
}

export function draftAddPoint(service: Service, list: ServicePointList): Service {
  return { ...service, [list]: [...service[list], servicePoint()] };
}

export function draftRemovePoint(service: Service, list: ServicePointList, index: number): Service {
  return { ...service, [list]: withoutAt(service[list], index) };
}

export function draftSetPointImage(
  service: Service,
  list: ServicePointList,
  index: number,
  language: AppLanguage,
  file: ServiceImageFile,
): Service {
  return {
    ...service,
    [list]: setLocalizedSlotImage(service[list], index, language, file),
  };
}

export function draftClearPointImage(
  service: Service,
  list: ServicePointList,
  index: number,
  language: AppLanguage,
): Service {
  return {
    ...service,
    [list]: clearLocalizedSlotImage(service[list], index, language),
  };
}

export function draftSetProject(service: Service, projectId: string, selected: boolean): Service {
  const without = service.projectIds.filter((item) => item !== projectId);
  return { ...service, projectIds: selected ? [...without, projectId] : without };
}

export function draftAddSector(service: Service): Service {
  return { ...service, sectors: [...service.sectors, serviceSector()] };
}

export function draftRemoveSector(service: Service, index: number): Service {
  return { ...service, sectors: withoutAt(service.sectors, index) };
}

export function draftSetSectorImage(
  service: Service,
  index: number,
  language: AppLanguage,
  file: ServiceImageFile,
): Service {
  return {
    ...service,
    sectors: mapAt(service.sectors, index, (item) => ({
      ...item,
      image: {
        ...item.image,
        [language]: withImage(item.image[language], file),
      },
    })),
  };
}

export function draftClearSectorImage(
  service: Service,
  index: number,
  language: AppLanguage,
): Service {
  return {
    ...service,
    sectors: mapAt(service.sectors, index, (item) => ({
      ...item,
      image: {
        ...item.image,
        [language]: withoutImage(item.image[language]),
      },
    })),
  };
}

export function draftSetFaq(
  service: Service,
  index: number,
  field: 'question' | 'answer',
  language: AppLanguage,
  value: string,
): Service {
  return {
    ...service,
    faqs: patchLocaleField(service.faqs, index, field, language, value),
  };
}

export function draftAddFaq(service: Service): Service {
  return { ...service, faqs: [...service.faqs, serviceFaq()] };
}

export function draftRemoveFaq(service: Service, index: number): Service {
  return { ...service, faqs: withoutAt(service.faqs, index) };
}
