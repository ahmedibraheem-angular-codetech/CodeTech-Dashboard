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

/**
 * Image value convention shared with the rest of the dashboard: `imageName` is the file
 * (or icon) name, `imageUrl` is a local path, an object URL, or `icon:<pi-class>` for a
 * library icon. An empty pair means no image.
 */
export interface ServiceImage {
  imageName: string;
  imageUrl: string;
}

/** Step 1 — one “why we need this service” item: a title and its icon. */
export interface ServiceWhyItem extends ServiceImage {
  id: string;
  title: LocaleText;
}

/** Step 1 — the introductory image shown beside the “why” items. */
export interface ServiceWhyImage extends ServiceImage {
  title: LocaleText;
}

/** Steps 2–4 — a solution (icon), a stage (image), or a feature (image). */
export interface ServicePoint extends ServiceImage {
  id: string;
  title: LocaleText;
  body: LocaleText;
}

/** Step 6 — a sector represented by its image. */
export interface ServiceSector extends ServiceImage {
  id: string;
}

/** Step 7 — a frequently asked question. */
export interface ServiceFaq {
  id: string;
  question: LocaleText;
  answer: LocaleText;
}

/**
 * Full service record for the list, wizard, and future detail view.
 * The list card reads `icon`, `name`, `description`, and `published`.
 */
export interface Service {
  id: string;
  /** Service-card icon, stored as a library icon class such as `pi-cog`. Independent of every image. */
  icon: string;
  published: boolean;
  name: LocaleText;
  description: LocaleText;
  /** Step 1 — introductory image with its title. */
  whyImage: ServiceWhyImage;
  /** Step 1 — why the service is needed. */
  whyItems: ServiceWhyItem[];
  /** Step 2 — solutions. */
  solutions: ServicePoint[];
  /** Step 3 — stages. */
  stages: ServicePoint[];
  /** Step 4 — features. */
  features: ServicePoint[];
  /** Step 5 — related projects, referenced by project id. */
  projectIds: string[];
  /** Step 6 — sectors. */
  sectors: ServiceSector[];
  /** Step 7 — frequently asked questions. */
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
