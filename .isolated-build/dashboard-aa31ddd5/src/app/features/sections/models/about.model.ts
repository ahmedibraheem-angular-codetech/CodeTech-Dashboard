import type { AppLanguage } from '../../../core/i18n/language';
import { type UploadedImageMeta } from '../../../shared/utils/image-upload';

export interface AboutImage extends UploadedImageMeta {
  uuid?: string;
  url?: string;
  downloadUrl?: string;
  file?: File;
}

export interface AboutPointGroup {
  id: string;
  title: string;
  highlight: string;
  points: string[];
}

export interface AboutGroups {
  texts: Record<AppLanguage, AboutPointGroup[]>;
  image: AboutImage | null;
}

export interface AboutCeoText {
  name: string;
  role: string;
  body: string;
  quote: string;
}

export interface AboutCeo {
  texts: Record<AppLanguage, AboutCeoText>;
  image: AboutImage | null;
}

export interface AboutMemberText {
  name: string;
  role: string;
}

export interface AboutMember {
  id: string;
  texts: Record<AppLanguage, AboutMemberText>;
  image: AboutImage | null;
}

export interface AboutPartner {
  id: string;
  name: string;
  monogram: string;
  image: AboutImage | null;
}

export interface AboutContent {
  story: AboutGroups;
  vision: AboutGroups;
  partners: AboutPartner[];
  ceo: AboutCeo;
  team: AboutMember[];
}
