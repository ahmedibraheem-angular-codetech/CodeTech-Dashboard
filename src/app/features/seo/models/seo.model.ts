import type { AppLanguage } from '../../../core/i18n/language';
import type { SeoApiPageKey } from './seo.api';

export type SeoTabId =
  | 'seo'
  | 'home'
  | 'about'
  | 'products'
  | 'projects'
  | 'services'
  | 'knowledge';

export interface SeoPageDef {
  id: SeoTabId;
  labelKey: string;
  icon: string;
}

export interface SeoContent {
  metaTitle: string;
  /** Shared across locales in the UI; API stores a single slug. */
  slug: string;

  keywords: string;
  description: string;
  thumbTitle: string;
  thumbAlt: string;
  thumbName: string;
  thumbUrl: string;
}

/**
 * In-editor page draft. Thumbnail is one file for both languages
 * (coat-check: File on replace, uuid for display, omit/null on write).
 */
export interface SeoPageDraft {
  ar: SeoContent;
  en: SeoContent;

  thumbUuid: string | null;

  thumbFile: File | null;
}

export type SeoLocale = AppLanguage;

export const DESCRIPTION_MAX = 160;
export const THUMB_MAX_BYTES = 5 * 1024 * 1024;
export const THUMB_TYPES = ['image/png', 'image/jpeg'];

export const SEO_PAGES: readonly SeoPageDef[] = [
  { id: 'seo', labelKey: 'nav.seo', icon: 'pi pi-search' },
  { id: 'home', labelKey: 'nav.home', icon: 'pi pi-home' },
  { id: 'about', labelKey: 'nav.about', icon: 'pi pi-building' },
  { id: 'products', labelKey: 'nav.products', icon: 'pi pi-box' },
  { id: 'projects', labelKey: 'nav.projects', icon: 'pi pi-briefcase' },
  { id: 'services', labelKey: 'nav.services', icon: 'pi pi-headphones' },
  { id: 'knowledge', labelKey: 'nav.knowledge', icon: 'pi pi-book' },
];

export const SEO_TAB_TO_API: Record<SeoTabId, SeoApiPageKey> = {
  seo: 'global',
  home: 'home',
  about: 'about',
  products: 'products',
  projects: 'projects',
  services: 'services',
  knowledge: 'knowledge_center',
};

export const SEO_API_TO_TAB: Record<SeoApiPageKey, SeoTabId> = {
  global: 'seo',
  home: 'home',
  about: 'about',
  products: 'products',
  projects: 'projects',
  services: 'services',
  knowledge_center: 'knowledge',
};

export function emptyContent(): SeoContent {
  return {
    metaTitle: '',
    slug: '',
    keywords: '',
    description: '',
    thumbTitle: '',
    thumbAlt: '',
    thumbName: '',
    thumbUrl: '',
  };
}

export function emptyDraft(): SeoPageDraft {
  return {
    ar: emptyContent(),
    en: emptyContent(),
    thumbUuid: null,
    thumbFile: null,
  };
}

export function isSeoTabId(value: string): value is SeoTabId {
  return value in SEO_TAB_TO_API;
}
