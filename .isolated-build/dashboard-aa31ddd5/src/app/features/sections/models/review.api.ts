import type { FileObject } from '../../../core/http/api.model';

export interface ReviewLocaleDto {
  ar: string | null;
  en: string | null;
}

export interface TestimonialDto {
  id: number;
  client_name: ReviewLocaleDto;
  job_title: ReviewLocaleDto | null;
  rating: number;
  comment: ReviewLocaleDto;
  is_published: boolean;
  sort_order: number;
  photo: FileObject | null;

  video: FileObject | null;
  created_at: string;
  updated_at: string;
}

export interface TestimonialWriteDto {
  client_name: { ar: string; en: string };
  job_title?: { ar: string; en: string } | null;
  comment: { ar: string; en: string };
  rating: number;
  is_published: boolean;
  photo?: string | null;
  video?: string | null;
}

export interface TestimonialPublishWriteDto {
  is_published: boolean;
}
