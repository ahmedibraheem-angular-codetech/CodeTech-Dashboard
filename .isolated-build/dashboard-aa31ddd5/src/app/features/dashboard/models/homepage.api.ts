import type { FileObject } from '../../../core/http/api.model';

export interface LocaleString {
  ar: string | null;
  en: string | null;
}

export interface LocaleStringList {
  ar: string[];
  en: string[];
}

export interface HomeBlockDto {
  title: LocaleString;
  description: LocaleString;
  points: LocaleStringList;
  
  image: FileObject | string | null;
}

export interface HomeIntroVideoDto {
  video: FileObject | null;
  is_visible: boolean;
}

export interface HomePartnerDto {
  id: number;
  logo: FileObject;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HomePageDto {
  about: HomeBlockDto;
  vision_2030: HomeBlockDto;
  intro_video: HomeIntroVideoDto;
  partners: HomePartnerDto[];
  updated_by: { id: number; name: string } | null;
  updated_at: string | null;
}

export interface HomeBlockWriteDto {
  title: LocaleString;
  description?: LocaleString | null;
  points?: LocaleStringList | null;
  /** Omit to keep, uuid to replace, null to remove. */
  image?: string | null;
}

export interface PartnerCreateDto {
  logo: string;
}
