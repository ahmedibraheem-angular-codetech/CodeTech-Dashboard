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

  image: { ar?: FileObject | null; en?: FileObject | null } | FileObject | string | null;
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
  image?: { ar?: string | null; en?: string | null } | null;
}

export interface PartnerCreateDto {
  logo: string;
}
