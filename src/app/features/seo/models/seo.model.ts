import type { AppLanguage } from '../../../core/i18n/translations';

/** A page whose SEO content is edited in the shared form. */
export interface SeoPageDef {
  id: string;
  labelKey: string;
  icon: string;
}

/** One language of a page: thumbnail copy plus the search-engine fields. */
export interface SeoContent {
  metaTitle: string;
  slug: string;
  keywords: string;
  description: string;
  thumbTitle: string;
  thumbAlt: string;
  thumbName: string;
  thumbUrl: string;
}

export type SeoLocale = AppLanguage;

export const DESCRIPTION_MAX = 160;
export const THUMB_MAX_BYTES = 5 * 1024 * 1024;
export const THUMB_TYPES = ['image/png', 'image/jpeg'];

/** Tabs in the design, right to left: site SEO, then each public page. */
export const SEO_PAGES: readonly SeoPageDef[] = [
  { id: 'seo', labelKey: 'nav.seo', icon: 'pi pi-search' },
  { id: 'home', labelKey: 'nav.home', icon: 'pi pi-home' },
  { id: 'about', labelKey: 'nav.about', icon: 'pi pi-building' },
  { id: 'products', labelKey: 'nav.products', icon: 'pi pi-box' },
  { id: 'projects', labelKey: 'nav.projects', icon: 'pi pi-briefcase' },
  { id: 'services', labelKey: 'nav.services', icon: 'pi pi-headphones' },
  { id: 'knowledge', labelKey: 'nav.knowledge', icon: 'pi pi-book' },
];

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
