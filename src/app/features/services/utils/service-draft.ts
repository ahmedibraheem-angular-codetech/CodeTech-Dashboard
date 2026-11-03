import type { AppLanguage } from '../../../core/i18n/language';
import type { LocaleText, LocalizedMedia, ServiceImage } from '../models/service.model';

export interface ServiceImageFile {
  name: string;
  url: string;
}

export function writeLocale(
  current: LocaleText,
  language: AppLanguage,
  value: string,
): LocaleText {
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
