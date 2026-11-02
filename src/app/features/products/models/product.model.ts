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
  /** Media coat-check UUID when known from the API or a fresh upload. */
  imageUuid?: string | null;
}

export interface ProductPoint extends ProductImage {
  id: string;
  title: LocaleText;
  body: LocaleText;
}

export interface ProductStat extends ProductImage {
  id: string;
  /** Bilingual figure text (API `value.{ar,en}`). */
  value: LocaleText;
  label: LocaleText;
  body: LocaleText;
}

export interface ProductMedia extends ProductImage {
  id: string;
  title: LocaleText;
  body: LocaleText;
}

/** Product-owned sector tiles: bilingual images only (API `sectors.*.image`). */
export interface ProductSector {
  id: string;
  image: Record<AppLanguage, ProductImage>;
}

export interface ProductUnit extends ProductImage {
  id: string;
  title: LocaleText;
  body: LocaleText;
  points: ProductPoint[];
}

export interface ProductFaq {
  id: string;
  question: LocaleText;
  answer: LocaleText;
}

export interface ProductSeo {
  /** Latin URL slug shared by both languages (API `slug`). Stored in `en`; `ar` kept for UI tabs. */
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
  /**
   * UI-only category chip. Not present on admin product write/read DTOs —
   * kept so the editor field is not deleted; value is not persisted by the API.
   */
  category: LocaleText;
  coverName: string;
  coverUrl: string;
  coverUuid: string | null;
  coverTitle: LocaleText;
  coverAlt: LocaleText;
  thumbName: string;
  thumbUrl: string;
  thumbUuid: string | null;
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

export function emptyProductImage(): ProductImage {
  return { imageName: '', imageUrl: '', imageUuid: null };
}

export function productPoint(title = localeText(), body = localeText()): ProductPoint {
  return { id: productId('point'), title, body, ...emptyProductImage() };
}

export function productStat(): ProductStat {
  return {
    id: productId('stat'),
    value: localeText(),
    label: localeText(),
    body: localeText(),
    ...emptyProductImage(),
  };
}

export function productMedia(): ProductMedia {
  return {
    id: productId('media'),
    title: localeText(),
    body: localeText(),
    ...emptyProductImage(),
  };
}

export function productSector(): ProductSector {
  return {
    id: productId('sector'),
    image: { ar: emptyProductImage(), en: emptyProductImage() },
  };
}

export function productUnit(): ProductUnit {
  return {
    id: productId('unit'),
    title: localeText(),
    body: localeText(),
    ...emptyProductImage(),
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
    category: localeText(),
    coverName: '',
    coverUrl: '',
    coverUuid: null,
    coverTitle: localeText(),
    coverAlt: localeText(),
    thumbName: '',
    thumbUrl: '',
    thumbUuid: null,
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
