import type { AppLanguage } from '../../../core/i18n/translations';
import {
  productFaq,
  productMedia,
  productPoint,
  productSector,
  productStat,
  productUnit,
  type LocaleText,
  type LocalizedMedia,
  type Product,
  type ProductImage,
} from '../models/product.model';

export type ProductPointList =
  'features' | 'challenges' | 'offer' | 'results' | 'steps' | 'highlights';

export type ProductMediaList = 'tools' | 'integrations' | 'identity';

export interface ProductUploadFile {
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

export function withProductImage(item: ProductImage, file: ProductUploadFile): ProductImage {
  return { imageName: file.name, imageUrl: file.url, imageUuid: null };
}

export function withoutProductImage(item: ProductImage): ProductImage {
  return { ...item, imageName: '', imageUrl: '', imageUuid: null };
}

export function removeKeepingMinOne<T>(items: readonly T[], index: number): T[] {
  return items.length > 1 ? items.filter((_, item) => item !== index) : [...items];
}

export function setLocalizedSlotImage<T extends { image: LocalizedMedia }>(
  items: readonly T[],
  index: number,
  language: AppLanguage,
  file: ProductUploadFile,
): T[] {
  return mapAtIndex(items, index, (item) => ({
    ...item,
    image: { ...item.image, [language]: withProductImage(item.image[language], file) },
  }));
}

export function clearLocalizedSlotImage<T extends { image: LocalizedMedia }>(
  items: readonly T[],
  index: number,
  language: AppLanguage,
): T[] {
  return mapAtIndex(items, index, (item) => ({
    ...item,
    image: { ...item.image, [language]: withoutProductImage(item.image[language]) },
  }));
}

export function draftSetLocaleField(
  product: Product,
  key: 'name' | 'summary',
  language: AppLanguage,
  value: string,
): Product {
  return { ...product, [key]: writeLocaleText(product[key], language, value) };
}

export function draftSetPointField(
  product: Product,
  list: ProductPointList,
  index: number,
  field: 'title' | 'body',
  language: AppLanguage,
  value: string,
): Product {
  return {
    ...product,
    [list]: patchItemLocaleField(product[list], index, field, language, value),
  };
}

export function draftAddPoint(product: Product, list: ProductPointList): Product {
  return { ...product, [list]: [...product[list], productPoint()] };
}

export function draftRemovePoint(product: Product, list: ProductPointList, index: number): Product {
  return { ...product, [list]: removeKeepingMinOne(product[list], index) };
}

export function draftSetPointImage(
  product: Product,
  list: ProductPointList,
  index: number,
  language: AppLanguage,
  file: ProductUploadFile,
): Product {
  return { ...product, [list]: setLocalizedSlotImage(product[list], index, language, file) };
}

export function draftSetMediaText(
  product: Product,
  list: ProductMediaList,
  index: number,
  field: 'title' | 'body',
  language: AppLanguage,
  value: string,
): Product {
  return {
    ...product,
    [list]: patchItemLocaleField(product[list], index, field, language, value),
  };
}

export function draftSetMediaImage(
  product: Product,
  list: ProductMediaList,
  index: number,
  language: AppLanguage,
  file: ProductUploadFile,
): Product {
  return { ...product, [list]: setLocalizedSlotImage(product[list], index, language, file) };
}

export function draftAddMedia(product: Product, list: ProductMediaList): Product {
  return { ...product, [list]: [...product[list], productMedia()] };
}

export function draftRemoveMedia(product: Product, list: ProductMediaList, index: number): Product {
  return { ...product, [list]: removeKeepingMinOne(product[list], index) };
}

export function draftAddSector(product: Product): Product {
  return { ...product, sectors: [...product.sectors, productSector()] };
}

export function draftRemoveSector(product: Product, index: number): Product {
  return { ...product, sectors: removeKeepingMinOne(product.sectors, index) };
}

export function draftSetSectorImage(
  product: Product,
  index: number,
  language: AppLanguage,
  file: ProductUploadFile,
): Product {
  return {
    ...product,
    sectors: setLocalizedSlotImage(product.sectors, index, language, file),
  };
}

export function draftClearSectorImage(
  product: Product,
  index: number,
  language: AppLanguage,
): Product {
  return {
    ...product,
    sectors: clearLocalizedSlotImage(product.sectors, index, language),
  };
}

export function draftSetSolutionField(
  product: Product,
  field: 'title' | 'body',
  language: AppLanguage,
  value: string,
): Product {
  return {
    ...product,
    solution: {
      ...product.solution,
      [field]: writeLocaleText(product.solution[field], language, value),
    },
  };
}

export function draftSetSolutionImage(
  product: Product,
  language: AppLanguage,
  file: ProductUploadFile,
): Product {
  return {
    ...product,
    solution: {
      ...product.solution,
      image: {
        ...product.solution.image,
        [language]: withProductImage(product.solution.image[language], file),
      },
    },
  };
}

export function draftSetCover(
  product: Product,
  kind: 'cover' | 'thumb',
  language: AppLanguage,
  file: ProductUploadFile,
): Product {
  const slot = kind === 'cover' ? product.cover : product.thumb;
  const next = {
    ...slot,
    [language]: withProductImage(slot[language], file),
  };
  return kind === 'cover' ? { ...product, cover: next } : { ...product, thumb: next };
}

export function draftSetCoverText(
  product: Product,
  key: 'coverTitle' | 'coverAlt' | 'thumbTitle' | 'thumbAlt',
  language: AppLanguage,
  value: string,
): Product {
  return { ...product, [key]: writeLocaleText(product[key], language, value) };
}

export function draftSetStat(
  product: Product,
  index: number,
  field: 'value' | 'label' | 'body',
  language: AppLanguage,
  value: string,
): Product {
  return {
    ...product,
    stats: product.stats.map((item, itemIndex) => {
      if (itemIndex !== index) {
        return item;
      }
      if (field === 'value') {
        return { ...item, value: writeLocaleText(item.value, language, value) };
      }
      return { ...item, [field]: writeLocaleText(item[field], language, value) };
    }),
  };
}

export function draftSetStatImage(
  product: Product,
  index: number,
  language: AppLanguage,
  file: ProductUploadFile,
): Product {
  return { ...product, stats: setLocalizedSlotImage(product.stats, index, language, file) };
}

export function draftAddStat(product: Product): Product {
  return { ...product, stats: [...product.stats, productStat()] };
}

export function draftRemoveStat(product: Product, index: number): Product {
  return { ...product, stats: removeKeepingMinOne(product.stats, index) };
}

export function draftSetUnit(
  product: Product,
  index: number,
  field: 'title' | 'body',
  language: AppLanguage,
  value: string,
): Product {
  return {
    ...product,
    units: patchItemLocaleField(product.units, index, field, language, value),
  };
}

export function draftSetUnitImage(
  product: Product,
  index: number,
  language: AppLanguage,
  file: ProductUploadFile,
): Product {
  return { ...product, units: setLocalizedSlotImage(product.units, index, language, file) };
}

export function draftSetUnitPoint(
  product: Product,
  unitIndex: number,
  pointIndex: number,
  field: 'title' | 'body',
  language: AppLanguage,
  value: string,
): Product {
  return {
    ...product,
    units: product.units.map((unit, index) =>
      index === unitIndex
        ? {
            ...unit,
            points: patchItemLocaleField(unit.points, pointIndex, field, language, value),
          }
        : unit,
    ),
  };
}

export function draftSetUnitPointImage(
  product: Product,
  unitIndex: number,
  pointIndex: number,
  language: AppLanguage,
  file: ProductUploadFile,
): Product {
  return {
    ...product,
    units: product.units.map((unit, index) =>
      index === unitIndex
        ? {
            ...unit,
            points: setLocalizedSlotImage(unit.points, pointIndex, language, file),
          }
        : unit,
    ),
  };
}

export function draftAddUnit(product: Product): Product {
  return { ...product, units: [...product.units, productUnit()] };
}

export function draftRemoveUnit(product: Product, index: number): Product {
  return { ...product, units: removeKeepingMinOne(product.units, index) };
}

export function draftRemoveUnitPoint(
  product: Product,
  unitIndex: number,
  pointIndex: number,
): Product {
  return {
    ...product,
    units: product.units.map((unit, index) =>
      index === unitIndex && unit.points.length > 1
        ? { ...unit, points: unit.points.filter((_, item) => item !== pointIndex) }
        : unit,
    ),
  };
}

export function draftAddUnitPoint(product: Product, unitIndex: number): Product {
  return {
    ...product,
    units: product.units.map((unit, index) =>
      index === unitIndex ? { ...unit, points: [...unit.points, productPoint()] } : unit,
    ),
  };
}

export function draftSetFaq(
  product: Product,
  index: number,
  field: 'question' | 'answer',
  language: AppLanguage,
  value: string,
): Product {
  return {
    ...product,
    faqs: patchItemLocaleField(product.faqs, index, field, language, value),
  };
}

export function draftAddFaq(product: Product): Product {
  return { ...product, faqs: [...product.faqs, productFaq()] };
}

export function draftRemoveFaq(product: Product, index: number): Product {
  return { ...product, faqs: removeKeepingMinOne(product.faqs, index) };
}

export function draftSetSeo(
  product: Product,
  field: keyof Product['seo'],
  language: AppLanguage,
  value: string,
): Product {
  return {
    ...product,
    seo: { ...product.seo, [field]: writeLocaleText(product.seo[field], language, value) },
  };
}
