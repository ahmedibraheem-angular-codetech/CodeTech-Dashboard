import type { AppLanguage } from '../../../core/i18n/language';

export interface LocaleText {
  ar: string;
  en: string;
}

export function readLocale(value: LocaleText, language: AppLanguage): string {
  return value[language];
}

export interface ProductImage {
  imageName: string;
  imageUrl: string;
  imageUuid?: string | null;
}

export type LocalizedMedia = Record<AppLanguage, ProductImage>;

export function emptyProductImage(): ProductImage {
  return { imageName: '', imageUrl: '', imageUuid: null };
}

export function emptyLocalizedMedia(): LocalizedMedia {
  return { ar: emptyProductImage(), en: emptyProductImage() };
}

export function readMedia(image: LocalizedMedia, language: AppLanguage): ProductImage {
  const current = image[language];
  if (current.imageUrl) {
    return current;
  }
  return image.ar.imageUrl ? image.ar : current;
}

export interface ProductPoint {
  id: string;
  title: LocaleText;
  body: LocaleText;
  image: LocalizedMedia;
}

export interface ProductStat {
  id: string;
  value: LocaleText;
  label: LocaleText;
  body: LocaleText;
  image: LocalizedMedia;
}

export interface ProductMedia {
  id: string;
  title: LocaleText;
  body: LocaleText;
  image: LocalizedMedia;
}

export interface ProductSector {
  id: string;
  image: LocalizedMedia;
}

export interface ProductUnit {
  id: string;
  title: LocaleText;
  body: LocaleText;
  image: LocalizedMedia;
  points: ProductPoint[];
}

export interface ProductFaq {
  id: string;
  question: LocaleText;
  answer: LocaleText;
}

export interface ProductSeo {
  slug: LocaleText;
  title: LocaleText;
  keywords: LocaleText;
  description: LocaleText;
}

export interface Product {
  id: string;
  code: string;
  published: boolean;
  name: LocaleText;
  summary: LocaleText;
  cover: LocalizedMedia;
  coverTitle: LocaleText;
  coverAlt: LocaleText;
  thumb: LocalizedMedia;
  thumbTitle: LocaleText;
  thumbAlt: LocaleText;
  features: ProductPoint[];
  stats: ProductStat[];
  sectors: ProductSector[];
  challenges: ProductPoint[];
  solution: ProductMedia;
  offer: ProductPoint[];
  results: ProductPoint[];
  tools: ProductMedia[];
  integrations: ProductMedia[];
  units: ProductUnit[];
  steps: ProductPoint[];
  identity: ProductMedia[];
  faqs: ProductFaq[];
  highlights: ProductPoint[];
  seo: ProductSeo;
}

export function localeText(ar = '', en = ''): LocaleText {
  return { ar, en };
}

let sequence = 0;

export function productId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

export function productPoint(title = localeText(), body = localeText()): ProductPoint {
  return { id: productId('point'), title, body, image: emptyLocalizedMedia() };
}

export function productStat(): ProductStat {
  return {
    id: productId('stat'),
    value: localeText(),
    label: localeText(),
    body: localeText(),
    image: emptyLocalizedMedia(),
  };
}

export function productMedia(): ProductMedia {
  return {
    id: productId('media'),
    title: localeText(),
    body: localeText(),
    image: emptyLocalizedMedia(),
  };
}

export function productSector(): ProductSector {
  return {
    id: productId('sector'),
    image: emptyLocalizedMedia(),
  };
}

export function productUnit(): ProductUnit {
  return {
    id: productId('unit'),
    title: localeText(),
    body: localeText(),
    image: emptyLocalizedMedia(),
    points: [productPoint(), productPoint(), productPoint(), productPoint()],
  };
}

export function productFaq(): ProductFaq {
  return { id: productId('faq'), question: localeText(), answer: localeText() };
}

export function blankProduct(): Product {
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
    features: [productPoint()],
    stats: [productStat()],
    sectors: [productSector()],
    challenges: [productPoint()],
    solution: productMedia(),
    offer: [productPoint()],
    results: [productPoint()],
    tools: [productMedia()],
    integrations: [productMedia()],
    units: [productUnit()],
    steps: [productPoint()],
    identity: [productMedia()],
    faqs: [productFaq()],
    highlights: [productPoint()],
    seo: {
      slug: localeText(),
      title: localeText(),
      keywords: localeText(),
      description: localeText(),
    },
  };
}
