import { type Observable, forkJoin, map, of } from 'rxjs';

import type { AppLanguage } from '../i18n/language';
import type { FileObject } from '../http/api.model';
import type { MediaService, MediaUploadType } from './media.service';

/** Backend shape for a per-language file in a response: {ar, en}, either side may be null. */
export interface LocalizedFileDto {
  ar: FileObject | null;
  en: FileObject | null;
}

/** Backend shape for a per-language file in a request: upload UUIDs. */
export interface LocalizedFileWriteDto {
  ar?: string | null;
  en?: string | null;
}

export interface LocalizedMediaFile {
  uuid: string;
  url: string;
  name: string;
  fileName: string;
  size: number;
}

export type LocalizedMedia = Record<AppLanguage, LocalizedMediaFile | null>;

export type LocalizedMediaIntent =
  { kind: 'omit' } | { kind: 'clear' } | { kind: 'replace'; file: File };

export type LocalizedMediaDraft = Record<AppLanguage, LocalizedMediaIntent>;

export const LOCALES: readonly AppLanguage[] = ['ar', 'en'];

export function emptyMediaDraft(): LocalizedMediaDraft {
  return { ar: { kind: 'omit' }, en: { kind: 'omit' } };
}

function mapFile(value: FileObject | null | undefined): LocalizedMediaFile | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  if (typeof value.uuid !== 'string' || typeof value.url !== 'string') {
    return null;
  }
  return {
    uuid: value.uuid,
    url: value.url,
    name: value.name || value.file_name || 'file',
    fileName: value.file_name || value.name || 'file',
    size: typeof value.size === 'number' ? value.size : 0,
  };
}

/**
 * Reads a media field. Accepts the new {ar, en} object and, for old payloads,
 * a single FileObject which counts as the Arabic file only (never copied to English).
 */
export function mapLocalizedMedia(
  value: LocalizedFileDto | FileObject | null | undefined,
): LocalizedMedia {
  if (!value || typeof value !== 'object') {
    return { ar: null, en: null };
  }
  if ('uuid' in value) {
    return { ar: mapFile(value), en: null };
  }
  return { ar: mapFile(value.ar), en: mapFile(value.en) };
}

/** Display file for a language. English falls back to Arabic only on read, like the website. */
export function pickMedia(
  media: LocalizedMedia | null | undefined,
  lang: AppLanguage,
): LocalizedMediaFile | null {
  return media?.[lang] ?? (lang === 'en' ? (media?.ar ?? null) : null);
}

/**
 * Uploads replaced files and builds the write object. Returns undefined when nothing
 * changed, so the field is left out of the request and the stored files stay.
 * A cleared language is null; a language left out is not sent.
 */
export function resolveLocalizedMedia(
  media: MediaService,
  type: MediaUploadType,
  draft: LocalizedMediaDraft | null | undefined,
): Observable<LocalizedFileWriteDto | undefined> {
  if (!draft) {
    return of(undefined);
  }
  const resolveOne = (intent: LocalizedMediaIntent): Observable<string | null | undefined> => {
    if (intent.kind === 'omit') {
      return of(undefined);
    }
    if (intent.kind === 'clear') {
      return of(null);
    }
    return media.upload(type, intent.file).pipe(map((file) => file.uuid));
  };
  return forkJoin({ ar: resolveOne(draft.ar), en: resolveOne(draft.en) }).pipe(
    map(({ ar, en }) => {
      const out: LocalizedFileWriteDto = {};
      if (ar !== undefined) {
        out.ar = ar;
      }
      if (en !== undefined) {
        out.en = en;
      }
      return Object.keys(out).length ? out : undefined;
    }),
  );
}

/** Uploads every slot's per-language draft and returns only the slots that changed. */
export function resolveLocalizedMediaMap<K extends string>(
  media: MediaService,
  type: MediaUploadType,
  drafts: Partial<Record<K, LocalizedMediaDraft>>,
): Observable<Partial<Record<K, LocalizedFileWriteDto>>> {
  const keys = Object.keys(drafts) as K[];
  if (!keys.length) {
    return of({});
  }
  const jobs = Object.fromEntries(
    keys.map((key) => [key, resolveLocalizedMedia(media, type, drafts[key])]),
  ) as Record<K, Observable<LocalizedFileWriteDto | undefined>>;
  return forkJoin(jobs).pipe(
    map((done) => {
      const out: Partial<Record<K, LocalizedFileWriteDto>> = {};
      for (const key of keys) {
        const value = done[key];
        if (value) {
          out[key] = value;
        }
      }
      return out;
    }),
  );
}
