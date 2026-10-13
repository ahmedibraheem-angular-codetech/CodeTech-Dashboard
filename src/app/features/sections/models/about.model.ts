import type { AppLanguage } from '../../../core/i18n/language';

/** Metadata of an uploaded image. `uploadedAt` is an ISO date (`yyyy-mm-dd`). */
export interface AboutImage {
  name: string;
  size: number;
  uploadedAt: string;
}

/** One titled checklist. `highlight` is the tinted note under the points. */
export interface AboutPointGroup {
  id: string;
  title: string;
  highlight: string;
  points: string[];
}

/** A bilingual checklist section. Story and vision share this shape; only story has an image. */
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

export interface AboutMember {
  id: string;
  name: string;
  role: string;
  image: AboutImage | null;
}

export interface AboutContent {
  story: AboutGroups;
  vision: AboutGroups;
  ceo: AboutCeo;
  team: AboutMember[];
}

export const ABOUT_IMAGE_TYPES: readonly string[] = ['image/png', 'image/jpeg'];
export const ABOUT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
