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

export interface ServiceImage {
  imageName: string;
  imageUrl: string;
  /** Media coat-check UUID when known from the API or a fresh upload. */
  imageUuid?: string | null;
}

export interface ServiceWhyItem extends ServiceImage {
  id: string;
  title: LocaleText;
}

export interface ServiceWhyImage extends ServiceImage {
  title: LocaleText;
}

export interface ServicePoint extends ServiceImage {
  id: string;
  title: LocaleText;
  body: LocaleText;
}

/** Sector media is bilingual on the API (`image.ar` / `image.en`). */
export interface ServiceSector {
  id: string;
  image: Record<AppLanguage, ServiceImage>;
}

export interface ServiceFaq {
  id: string;
  question: LocaleText;
  answer: LocaleText;
}

/** Project link returned on service detail (Projects module stays separate). */
export interface ServiceLinkedProject {
  id: string;
  title: LocaleText;
  description: LocaleText;
  coverUrl: string;
  published: boolean;
  visible: boolean;
}

export interface Service {
  id: string;
  code: string;

  /** Local PrimeIcon class for the picker (not sent as media). */
  icon: string;
  /** Display URL when the API icon is a media file. */
  iconUrl: string;
  iconUuid: string | null;
  published: boolean;
  name: LocaleText;
  description: LocaleText;

  whyImage: ServiceWhyImage;

  whyItems: ServiceWhyItem[];

  solutions: ServicePoint[];

  stages: ServicePoint[];

  features: ServicePoint[];

  projectIds: string[];

  linkedProjects: ServiceLinkedProject[];

  sectors: ServiceSector[];

  faqs: ServiceFaq[];
}

export const SERVICE_STEPS = [
  { id: 'why', labelKey: 'service.step.why' },
  { id: 'solutions', labelKey: 'service.step.solutions' },
  { id: 'stages', labelKey: 'service.step.stages' },
  { id: 'features', labelKey: 'service.step.features' },
  { id: 'projects', labelKey: 'service.step.projects' },
  { id: 'sectors', labelKey: 'service.step.sectors' },
  { id: 'faq', labelKey: 'service.step.faq' },
] as const;

export type ServiceStepId = (typeof SERVICE_STEPS)[number]['id'];

let sequence = 0;

export function serviceItemId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

export function serviceWhyItem(title = localeText()): ServiceWhyItem {
  return { id: serviceItemId('why'), title, imageName: '', imageUrl: '', imageUuid: null };
}

export function servicePoint(title = localeText(), body = localeText()): ServicePoint {
  return {
    id: serviceItemId('point'),
    title,
    body,
    imageName: '',
    imageUrl: '',
    imageUuid: null,
  };
}

export function emptyServiceImage(): ServiceImage {
  return { imageName: '', imageUrl: '', imageUuid: null };
}

export function serviceSector(): ServiceSector {
  return {
    id: serviceItemId('sector'),
    image: { ar: emptyServiceImage(), en: emptyServiceImage() },
  };
}

export function serviceFaq(): ServiceFaq {
  return { id: serviceItemId('faq'), question: localeText(), answer: localeText() };
}

export function blankService(): Service {
  return {
    id: '',
    code: '',
    icon: '',
    iconUrl: '',
    iconUuid: null,
    published: true,
    name: localeText(),
    description: localeText(),
    whyImage: { title: localeText(), imageName: '', imageUrl: '', imageUuid: null },
    whyItems: [serviceWhyItem()],
    solutions: [servicePoint()],
    stages: [servicePoint()],
    features: [servicePoint()],
    projectIds: [],
    linkedProjects: [],
    sectors: [serviceSector()],
    faqs: [serviceFaq()],
  };
}
