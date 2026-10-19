import type { AppLanguage } from '../../../core/i18n/language';

export interface LocaleText {
  ar: string;
  en: string;
}

export function readLocale(value: LocaleText, language: AppLanguage): string {
  return value[language];
}

export interface ProductPoint {
  id: string;
  title: LocaleText;
  body: LocaleText;
  imageName: string;
  imageUrl: string;
}

export interface ProductStat {
  id: string;
  value: string;
  label: LocaleText;
  body: LocaleText;
  imageName: string;
  imageUrl: string;
}

export interface ProductMedia {
  id: string;
  title: LocaleText;
  body: LocaleText;
  imageName: string;
  imageUrl: string;
}

export interface ProductUnit {
  id: string;
  title: LocaleText;
  body: LocaleText;
  imageName: string;
  imageUrl: string;
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
  published: boolean;
  name: LocaleText;
  summary: LocaleText;
  category: LocaleText;
  coverName: string;
  coverUrl: string;
  coverTitle: LocaleText;
  coverAlt: LocaleText;
  thumbName: string;
  thumbUrl: string;
  thumbTitle: LocaleText;
  thumbAlt: LocaleText;
  features: ProductPoint[];
  stats: ProductStat[];
  sectors: ProductMedia[];
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

export const PRODUCT_STEPS = [
  { id: 'info', labelKey: 'product.step.info' },
  { id: 'sectors', labelKey: 'product.step.sectors' },
  { id: 'offer', labelKey: 'product.step.offer' },
  { id: 'tools', labelKey: 'product.step.tools' },
  { id: 'units', labelKey: 'product.step.units' },
  { id: 'identity', labelKey: 'product.step.identity' },
  { id: 'faq', labelKey: 'product.step.faq' },
  { id: 'seo', labelKey: 'product.step.seo' },
] as const;

export type ProductStepId = (typeof PRODUCT_STEPS)[number]['id'];

export function localeText(ar = '', en = ''): LocaleText {
  return { ar, en };
}

let sequence = 0;

export function productId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

export function productPoint(title = localeText(), body = localeText()): ProductPoint {
  return { id: productId('point'), title, body, imageName: '', imageUrl: '' };
}

export function productStat(): ProductStat {
  return {
    id: productId('stat'),
    value: '',
    label: localeText(),
    body: localeText(),
    imageName: '',
    imageUrl: '',
  };
}

export function productMedia(): ProductMedia {
  return {
    id: productId('media'),
    title: localeText(),
    body: localeText(),
    imageName: '',
    imageUrl: '',
  };
}

export function productUnit(): ProductUnit {
  return {
    id: productId('unit'),
    title: localeText(),
    body: localeText(),
    imageName: '',
    imageUrl: '',
    points: [productPoint(), productPoint(), productPoint(), productPoint()],
  };
}

export function productFaq(): ProductFaq {
  return { id: productId('faq'), question: localeText(), answer: localeText() };
}

export function blankProduct(): Product {
  return {
    id: '',
    published: true,
    name: localeText(),
    summary: localeText(),
    category: localeText(),
    coverName: '',
    coverUrl: '',
    coverTitle: localeText(),
    coverAlt: localeText(),
    thumbName: '',
    thumbUrl: '',
    thumbTitle: localeText(),
    thumbAlt: localeText(),
    features: [productPoint()],
    stats: [productStat()],
    sectors: [productMedia()],
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
