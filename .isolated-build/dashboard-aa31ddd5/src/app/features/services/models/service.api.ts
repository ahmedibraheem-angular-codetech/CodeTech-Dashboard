import type { FileObject } from '../../../core/http/api.model';

export interface ServiceLocaleDto {
  ar: string | null;
  en: string | null;
}

export interface ServiceListDto {
  id: number;
  code: string;
  name: ServiceLocaleDto;
  description: ServiceLocaleDto;
  icon: FileObject | null;
  status: string;
  slug: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceNeedDto {
  id: number;
  title: ServiceLocaleDto;
  icon: FileObject | null;
  sort_order: number;
}

export interface ServiceSolutionDto {
  id: number;
  title: ServiceLocaleDto;
  short_description: ServiceLocaleDto;
  icon: FileObject | null;
  sort_order: number;
}

export interface ServiceStageDto {
  id: number;
  title: ServiceLocaleDto;
  short_description: ServiceLocaleDto;
  image: FileObject | null;
  sort_order: number;
}

export interface ServiceFeatureDto {
  id: number;
  title: ServiceLocaleDto;
  short_description: ServiceLocaleDto;
  image: FileObject | null;
  sort_order: number;
}

export interface ServiceSectorImageDto {
  ar: FileObject | null;
  en: FileObject | null;
}

export interface ServiceSectorDto {
  id: number;
  image: ServiceSectorImageDto;
  sort_order: number;
}

export interface ServiceFaqDto {
  id: number;
  question: ServiceLocaleDto;
  answer: ServiceLocaleDto;
  sort_order: number;
}

export interface ServiceLinkedProjectDto {
  id: number;
  title: ServiceLocaleDto;
  description: ServiceLocaleDto;
  cover: FileObject | null;
  status: string;
  is_visible: boolean;
  sort_order: number;
}

export interface ServiceDetailDto extends ServiceListDto {
  why_image: FileObject | null;
  why_image_text: ServiceLocaleDto;
  needs: ServiceNeedDto[];
  solutions: ServiceSolutionDto[];
  stages: ServiceStageDto[];
  features: ServiceFeatureDto[];
  sectors: ServiceSectorDto[];
  faqs: ServiceFaqDto[];
  projects: ServiceLinkedProjectDto[];
}

export interface ServiceNeedWriteDto {
  id?: number;
  title: { ar: string; en: string };
  icon?: string | null;
}

export interface ServiceSolutionWriteDto {
  id?: number;
  title: { ar: string; en: string };
  short_description: { ar: string; en: string };
  icon?: string | null;
}

export interface ServiceStageWriteDto {
  id?: number;
  title: { ar: string; en: string };
  short_description: { ar: string; en: string };
  image?: string | null;
}

export interface ServiceFeatureWriteDto {
  id?: number;
  title: { ar: string; en: string };
  short_description: { ar: string; en: string };
  image?: string | null;
}

export interface ServiceSectorWriteDto {
  id?: number;
  image: { ar: string | null; en: string | null };
}

export interface ServiceFaqWriteDto {
  id?: number;
  question: { ar: string; en: string };
  answer: { ar: string; en: string };
}

export interface ServiceProjectWriteDto {
  id: number;
  is_visible?: boolean;
}

export interface ServiceWriteDto {
  status?: string;
  name: { ar: string; en: string };
  description?: { ar: string; en: string };
  icon?: string | null;
  why_image?: string | null;
  why_image_text?: { ar: string; en: string };
  needs?: ServiceNeedWriteDto[];
  solutions?: ServiceSolutionWriteDto[];
  stages?: ServiceStageWriteDto[];
  features?: ServiceFeatureWriteDto[];
  sectors?: ServiceSectorWriteDto[];
  faqs?: ServiceFaqWriteDto[];
  projects?: ServiceProjectWriteDto[];
}

export interface ServiceStatusWriteDto {
  status: string;
}

export type ServiceListName =
  | 'needs'
  | 'solutions'
  | 'stages'
  | 'features'
  | 'sectors'
  | 'faqs';
