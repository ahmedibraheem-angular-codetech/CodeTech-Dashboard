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

export interface ServiceSector extends ServiceImage {
  id: string;
}

export interface ServiceFaq {
  id: string;
  question: LocaleText;
  answer: LocaleText;
}

export interface Service {
  id: string;

  icon: string;
  published: boolean;
  name: LocaleText;
  description: LocaleText;

  whyImage: ServiceWhyImage;

  whyItems: ServiceWhyItem[];

  solutions: ServicePoint[];

  stages: ServicePoint[];

  features: ServicePoint[];

  projectIds: string[];

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
  return { id: serviceItemId('why'), title, imageName: '', imageUrl: '' };
}

export function servicePoint(title = localeText(), body = localeText()): ServicePoint {
  return { id: serviceItemId('point'), title, body, imageName: '', imageUrl: '' };
}

export function serviceSector(): ServiceSector {
  return { id: serviceItemId('sector'), imageName: '', imageUrl: '' };
}

export function serviceFaq(): ServiceFaq {
  return { id: serviceItemId('faq'), question: localeText(), answer: localeText() };
}

export function blankService(): Service {
  return {
    id: '',
    icon: '',
    published: true,
    name: localeText(),
    description: localeText(),
    whyImage: { title: localeText(), imageName: '', imageUrl: '' },
    whyItems: [serviceWhyItem()],
    solutions: [servicePoint()],
    stages: [servicePoint()],
    features: [servicePoint()],
    projectIds: [],
    sectors: [serviceSector()],
    faqs: [serviceFaq()],
  };
}
