import type { FileObject } from '../../../core/http/api.model';

export interface ProductLocaleDto {
  ar: string | null;
  en: string | null;
}

export interface ProductKeywordsDto {
  ar: string[] | null;
  en: string[] | null;
}

export interface ProductListFeatureDto {
  id: number;
  title: ProductLocaleDto;
  short_description: ProductLocaleDto;
  icon: FileObject | null;
  sort_order: number;
}

export interface ProductListDto {
  id: number;
  code: string;
  title: ProductLocaleDto;
  description: ProductLocaleDto;
  short_description: ProductLocaleDto;
  cover: FileObject | null;
  thumbnail: FileObject | null;
  features: ProductListFeatureDto[];
  status: string;
  slug: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductPointDto {
  id: number;
  title: ProductLocaleDto;
  short_description: ProductLocaleDto;
  icon?: FileObject | null;
  image?: FileObject | null;
  sort_order?: number;
}

export interface ProductStatDto {
  id: number;
  title: ProductLocaleDto;
  value: ProductLocaleDto;
  background: FileObject | null;
  sort_order?: number;
}

export interface ProductSectorDto {
  id: number;
  image: { ar: FileObject | null; en: FileObject | null };
  sort_order?: number;
}

export interface ProductIntegrationDto {
  id: number;
  image: FileObject | null;
  sort_order?: number;
}

export interface ProductModuleFeatureDto {
  id: number;
  title: ProductLocaleDto;
  short_description: ProductLocaleDto;
  icon: FileObject | null;
  sort_order?: number;
}

export interface ProductModuleDto {
  id: number;
  title: ProductLocaleDto;
  short_description: ProductLocaleDto;
  image: FileObject | null;
  features: ProductModuleFeatureDto[];
  sort_order?: number;
}

export interface ProductFaqDto {
  id: number;
  question: ProductLocaleDto;
  answer: ProductLocaleDto;
  sort_order?: number;
}

export interface ProductDetailDto extends ProductListDto {
  cover_title: ProductLocaleDto;
  cover_alt: ProductLocaleDto;
  thumbnail_title: ProductLocaleDto;
  thumbnail_alt: ProductLocaleDto;
  solution_title: ProductLocaleDto;
  solution_description: ProductLocaleDto;
  solution_image: FileObject | null;
  stats: ProductStatDto[];
  sectors: ProductSectorDto[];
  challenges: ProductPointDto[];
  offerings: ProductPointDto[];
  results: ProductPointDto[];
  advantages: ProductPointDto[];
  integrations: ProductIntegrationDto[];
  modules: ProductModuleDto[];
  workflow_steps: ProductPointDto[];
  identity_items: ProductPointDto[];
  reasons: ProductPointDto[];
  faqs: ProductFaqDto[];
  meta_title: ProductLocaleDto | null;
  meta_keywords: ProductKeywordsDto | null;
  meta_description: ProductLocaleDto | null;
}

export interface ProductPointWriteDto {
  id?: number;
  title: { ar: string; en: string };
  short_description: { ar: string; en: string };
  icon?: string | null;
  image?: string | null;
}

export interface ProductStatWriteDto {
  id?: number;
  title: { ar: string; en: string };
  value: { ar: string; en: string };
  background?: string | null;
}

export interface ProductSectorWriteDto {
  id?: number;
  image: { ar: string | null; en: string | null };
}

export interface ProductIntegrationWriteDto {
  id?: number;
  image?: string | null;
}

export interface ProductModuleFeatureWriteDto {
  id?: number;
  title: { ar: string; en: string };
  short_description: { ar: string; en: string };
  icon?: string | null;
}

export interface ProductModuleWriteDto {
  id?: number;
  title: { ar: string; en: string };
  short_description: { ar: string; en: string };
  image?: string | null;
  features?: ProductModuleFeatureWriteDto[];
}

export interface ProductFaqWriteDto {
  id?: number;
  question: { ar: string; en: string };
  answer: { ar: string; en: string };
}

export interface ProductWriteDto {
  status?: string;
  title: { ar: string; en: string };
  description?: { ar: string; en: string };
  short_description?: { ar: string; en: string };
  cover?: string | null;
  cover_title?: { ar: string; en: string };
  cover_alt?: { ar: string; en: string };
  thumbnail?: string | null;
  thumbnail_title?: { ar: string; en: string };
  thumbnail_alt?: { ar: string; en: string };
  solution_title?: { ar: string; en: string };
  solution_description?: { ar: string; en: string };
  solution_image?: string | null;
  features?: ProductPointWriteDto[];
  stats?: ProductStatWriteDto[];
  sectors?: ProductSectorWriteDto[];
  challenges?: ProductPointWriteDto[];
  offerings?: ProductPointWriteDto[];
  results?: ProductPointWriteDto[];
  advantages?: ProductPointWriteDto[];
  integrations?: ProductIntegrationWriteDto[];
  modules?: ProductModuleWriteDto[];
  workflow_steps?: ProductPointWriteDto[];
  identity_items?: ProductPointWriteDto[];
  reasons?: ProductPointWriteDto[];
  faqs?: ProductFaqWriteDto[];
  meta_title?: { ar: string; en: string };
  slug?: string | null;
  meta_keywords?: { ar: string[]; en: string[] };
  meta_description?: { ar: string; en: string };
}

export interface ProductStatusWriteDto {
  status: string;
}

export interface ProductListQuery {
  search?: string;
  status?: string;
  page?: number;
  perPage?: number;
}
