import type { FileObject } from '../../../core/http/api.model';

export interface ProjectLocaleDto {
  ar: string | null;
  en: string | null;
}

export interface ProjectKeywordsDto {
  ar: string[] | null;
  en: string[] | null;
}

export interface ProjectTagDto {
  id: number;
  title: ProjectLocaleDto;
  short_description: ProjectLocaleDto;
  icon: FileObject | null;
  sort_order?: number;
}

export interface ProjectOverviewCardDto {
  id: number;
  subject: ProjectLocaleDto;
  title: ProjectLocaleDto;
  description: ProjectLocaleDto;
  background: FileObject | null;
  sort_order?: number;
}

export interface ProjectPointDto {
  id: number;
  title: ProjectLocaleDto;
  short_description: ProjectLocaleDto;
  icon?: FileObject | null;
  image?: FileObject | null;
  sort_order?: number;
}

export interface ProjectToolDto {
  id: number;
  image: FileObject | null;
  sort_order?: number;
}

export interface ProjectGalleryDto {
  id: number;
  image: FileObject | null;
  sort_order?: number;
}

export interface ProjectResultDto {
  id: number;
  title: ProjectLocaleDto;
  value: ProjectLocaleDto;
  icon: FileObject | null;
  sort_order?: number;
}

export interface ProjectIdentityImageDto {
  id: number;
  image: FileObject | null;
  sort_order?: number;
}

export interface ProjectIdentityItemDto {
  id: number;
  title: ProjectLocaleDto;
  short_description: ProjectLocaleDto;
  images: ProjectIdentityImageDto[];
  sort_order?: number;
}

export interface ProjectListDto {
  id: number;
  code: string;
  title: ProjectLocaleDto;
  description: ProjectLocaleDto;
  cover: FileObject | null;
  thumbnail: FileObject | null;
  tags: ProjectTagDto[];
  status: string;
  slug: string | null;
  is_featured?: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetailDto extends ProjectListDto {
  cover_title: ProjectLocaleDto;
  cover_alt: ProjectLocaleDto;
  thumbnail_title: ProjectLocaleDto;
  thumbnail_alt: ProjectLocaleDto;
  solutions_image: FileObject | null;
  solutions_image_title: ProjectLocaleDto;
  solutions_image_alt: ProjectLocaleDto;
  overview_cards: ProjectOverviewCardDto[];
  challenges: ProjectPointDto[];
  tools: ProjectToolDto[];
  solutions: ProjectPointDto[];
  gallery: ProjectGalleryDto[];
  features: ProjectPointDto[];
  results: ProjectResultDto[];
  identity_items: ProjectIdentityItemDto[];
  meta_title: ProjectLocaleDto | null;
  meta_keywords: ProjectKeywordsDto | null;
  meta_description: ProjectLocaleDto | null;
}

export interface ProjectTagWriteDto {
  id?: number;
  title: { ar: string; en: string };
  short_description: { ar: string; en: string };
  icon?: string | null;
}

export interface ProjectOverviewCardWriteDto {
  id?: number;
  subject: { ar: string; en: string };
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  background?: string | null;
}

export interface ProjectPointWriteDto {
  id?: number;
  title: { ar: string; en: string };
  short_description: { ar: string; en: string };
  icon?: string | null;
  image?: string | null;
}

export interface ProjectToolWriteDto {
  id?: number;
  image?: string | null;
}

export interface ProjectGalleryWriteDto {
  id?: number;
  image?: string | null;
}

export interface ProjectResultWriteDto {
  id?: number;
  title: { ar: string; en: string };
  value: { ar: string; en: string };
  icon?: string | null;
}

export interface ProjectIdentityImageWriteDto {
  id?: number;
  image?: string | null;
}

export interface ProjectIdentityItemWriteDto {
  id?: number;
  title: { ar: string; en: string };
  short_description: { ar: string; en: string };
  images?: ProjectIdentityImageWriteDto[];
}

export interface ProjectWriteDto {
  status?: string;
  title: { ar: string; en: string };
  description?: { ar: string; en: string };
  cover?: string | null;
  cover_title?: { ar: string; en: string };
  cover_alt?: { ar: string; en: string };
  thumbnail?: string | null;
  thumbnail_title?: { ar: string; en: string };
  thumbnail_alt?: { ar: string; en: string };
  solutions_image?: string | null;
  solutions_image_title?: { ar: string; en: string };
  solutions_image_alt?: { ar: string; en: string };
  tags?: ProjectTagWriteDto[];
  overview_cards?: ProjectOverviewCardWriteDto[];
  challenges?: ProjectPointWriteDto[];
  tools?: ProjectToolWriteDto[];
  solutions?: ProjectPointWriteDto[];
  gallery?: ProjectGalleryWriteDto[];
  features?: ProjectPointWriteDto[];
  results?: ProjectResultWriteDto[];
  identity_items?: ProjectIdentityItemWriteDto[];
  meta_title?: { ar: string; en: string };
  slug?: string | null;
  meta_keywords?: { ar: string[]; en: string[] };
  meta_description?: { ar: string; en: string };
}

export interface ProjectStatusWriteDto {
  status: string;
}

export interface ProjectFeatureWriteDto {
  is_featured: boolean;
}

export type ProjectListName =
  | 'tags'
  | 'overview_cards'
  | 'challenges'
  | 'tools'
  | 'solutions'
  | 'gallery'
  | 'features'
  | 'results'
  | 'identity_items';

export interface ProjectListQuery {
  search?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

/** Projects marketing page (GET /admin/pages/projects). */
export interface ProjectsPageSectionsDto {
  stats_visible: boolean;
  projects_visible: boolean;
}

export interface ProjectsPageStatDto {
  id: number;
  title: ProjectLocaleDto;
  value: ProjectLocaleDto;
  sort_order?: number;
}

export interface ProjectsPageDto {
  sections: ProjectsPageSectionsDto;
  stats: ProjectsPageStatDto[];
}

export interface ProjectsPageSectionsWriteDto {
  stats_visible?: boolean;
  projects_visible?: boolean;
}

export interface ProjectsPageStatWriteDto {
  title: { ar: string; en?: string };
  value?: { ar: string; en?: string };
}
