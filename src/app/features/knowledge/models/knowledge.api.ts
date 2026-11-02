import type { FileObject } from '../../../core/http/api.model';

export interface KnowledgeLocaleDto {
  ar: string | null;
  en: string | null;
}

export interface KnowledgeKeywordsDto {
  ar: string[] | null;
  en: string[] | null;
}

export interface ArticleCategoryRefDto {
  id: number;
  name: KnowledgeLocaleDto;
}

export interface ArticleCategoryDto {
  id: number;
  name: KnowledgeLocaleDto;
  is_published: boolean;
  sort_order: number;
  articles_count: number;
  created_at: string;
  updated_at: string;
}

export interface ArticleListDto {
  id: number;
  code: string;
  title: KnowledgeLocaleDto;
  excerpt: KnowledgeLocaleDto;
  category: ArticleCategoryRefDto;
  thumbnail: FileObject | null;
  reading_time_minutes: number;
  status: string;
  is_scheduled: boolean;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleDetailDto extends ArticleListDto {
  content: KnowledgeLocaleDto;
  author_name: KnowledgeLocaleDto;
  author_photo: FileObject | null;
  thumbnail_title: KnowledgeLocaleDto;
  thumbnail_alt: KnowledgeLocaleDto;
  cover: FileObject | null;
  cover_title: KnowledgeLocaleDto;
  cover_alt: KnowledgeLocaleDto;
  meta_title: KnowledgeLocaleDto;
  slug: string | null;
  meta_keywords: KnowledgeKeywordsDto;
  meta_description: KnowledgeLocaleDto;
}

export interface ArticleCategoryWriteDto {
  name: { ar: string; en: string };
  is_published: boolean;
}

export interface ArticleCategoryPublishWriteDto {
  is_published: boolean;
}

export interface ArticleStatusWriteDto {
  status: string;
}

export interface ArticleFeatureWriteDto {
  is_featured: boolean;
}

export interface ArticleWriteDto {
  status: string;
  article_category_id: number;
  title: { ar: string; en: string };
  excerpt: { ar: string; en: string };
  content: { ar: string; en: string };
  reading_time_minutes?: number;
  is_featured?: boolean;
  author_name?: { ar: string; en: string };
  author_photo?: string | null;
  thumbnail?: string | null;
  cover?: string | null;
  thumbnail_title?: { ar: string; en: string };
  thumbnail_alt?: { ar: string; en: string };
  cover_title?: { ar: string; en: string };
  cover_alt?: { ar: string; en: string };
  slug?: string | null;
  meta_title?: { ar: string; en: string };
  meta_description?: { ar: string; en: string };
  meta_keywords?: { ar: string[]; en: string[] };
  published_at?: string | null;
}

export interface ArticleStatMetricDto {
  value: number;
  previous: number | null;
  change_pct: number | null;
}

export interface ArticleStatsDto {
  total: ArticleStatMetricDto;
  published: ArticleStatMetricDto;
  featured: ArticleStatMetricDto;
  unpublished: ArticleStatMetricDto;
}
