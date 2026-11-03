import type { FileObject } from '../../../core/http/api.model';

export type SeoApiPageKey =
  | 'global'
  | 'home'
  | 'about'
  | 'products'
  | 'projects'
  | 'services'
  | 'knowledge_center';

export interface SeoLocaleDto {
  ar: string | null;
  en: string | null;
}

export interface SeoKeywordsDto {
  ar: string[] | null;
  en: string[] | null;
}

export interface SeoPageDto {
  page: SeoApiPageKey;
  meta_title: SeoLocaleDto | null;
  /** Single slug for both languages. */
  slug: string | null;
  meta_keywords: SeoKeywordsDto | null;
  meta_description: SeoLocaleDto | null;
  thumbnail: FileObject | null;
  thumbnail_title: SeoLocaleDto | null;
  thumbnail_alt: SeoLocaleDto | null;
  updated_by: { id: number; name: string } | null;
  updated_at: string | null;
}

export interface SeoPageWriteDto {
  meta_title?: { ar: string; en: string } | null;
  slug?: string | null;
  meta_keywords?: { ar: string[]; en: string[] } | null;
  meta_description?: { ar: string; en: string } | null;
  thumbnail_title?: { ar: string; en: string } | null;
  thumbnail_alt?: { ar: string; en: string } | null;
  thumbnail?: string | null;
}
