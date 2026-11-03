import type { FileObject } from '../../../core/http/api.model';

export interface AboutLocaleString {
  ar: string | null;
  en: string | null;
}

export interface AboutLocaleStringList {
  ar: string[];
  en: string[];
}

export interface AboutBlockDto {
  philosophy_points: AboutLocaleStringList;
  target_market_points: AboutLocaleStringList;
  image: FileObject | null;
}

export interface AboutVisionMissionDto {
  vision_points: AboutLocaleStringList;
  vision_quote: AboutLocaleString;
  mission_points: AboutLocaleStringList;
  mission_quote: AboutLocaleString;
}

export interface AboutCeoDto {
  name: AboutLocaleString;
  job_title: AboutLocaleString | null;
  description: AboutLocaleString | null;
  quote: AboutLocaleString | null;
  image: FileObject | null;
}

export interface AboutTeamMemberDto {
  id: number;
  name: AboutLocaleString;
  job_title: AboutLocaleString | null;
  photo: FileObject | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AboutPageDto {
  about: AboutBlockDto;
  vision_mission: AboutVisionMissionDto;
  ceo: AboutCeoDto;
  team: AboutTeamMemberDto[];
  updated_by: { id: number; name: string } | null;
  updated_at: string | null;
}

export interface AboutBlockWriteDto {
  philosophy_points?: AboutLocaleStringList | null;
  target_market_points?: AboutLocaleStringList | null;
  /** Omit to keep, uuid to replace, null to remove. */
  image?: string | null;
}

export interface AboutVisionMissionWriteDto {
  vision_points?: AboutLocaleStringList | null;
  vision_quote?: AboutLocaleString | null;
  mission_points?: AboutLocaleStringList | null;
  mission_quote?: AboutLocaleString | null;
}

export interface AboutCeoWriteDto {
  name: AboutLocaleString;
  job_title?: AboutLocaleString | null;
  description?: AboutLocaleString | null;
  quote?: AboutLocaleString | null;
  image?: string | null;
}

export interface AboutTeamMemberWriteDto {
  name: AboutLocaleString;
  job_title?: AboutLocaleString | null;
  /** Omit to keep, uuid to replace, null to remove. */
  photo?: string | null;
}

export interface AboutPartnerDto {
  id: number;
  logo: FileObject;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AboutPartnerCreateDto {
  logo: string;
}
