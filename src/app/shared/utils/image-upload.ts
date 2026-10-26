import { toIsoDate } from './date';

/** PNG and JPEG only — shared by About and Dashboard image pickers. */
export const IMAGE_UPLOAD_TYPES: readonly string[] = ['image/png', 'image/jpeg'];

/** 5 MB cap — shared by About and Dashboard image pickers. */
export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

/** Native `accept` value for file inputs and drop zones. */
export const IMAGE_UPLOAD_ACCEPT = 'image/png,image/jpeg';

export interface UploadedImageMeta {
  name: string;
  size: number;
  /** ISO date (`yyyy-mm-dd`). */
  uploadedAt: string;
}

export type ImageUploadErrorKey = 'home.imageType' | 'home.imageSize';

export type ImageUploadParseResult =
  { ok: true; image: UploadedImageMeta } | { ok: false; errorKey: ImageUploadErrorKey };

/**
 * Validates a picked image and builds metadata. Returns `null` when no file was provided.
 * Callers own preview object URLs and feature-specific save/cancel flows.
 */
export function parseUploadedImage(
  file: File | undefined,
  clock: () => Date = () => new Date(),
): ImageUploadParseResult | null {
  if (!file) {
    return null;
  }
  if (!IMAGE_UPLOAD_TYPES.includes(file.type)) {
    return { ok: false, errorKey: 'home.imageType' };
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    return { ok: false, errorKey: 'home.imageSize' };
  }
  return {
    ok: true,
    image: {
      name: file.name,
      size: file.size,
      uploadedAt: toIsoDate(clock()),
    },
  };
}
