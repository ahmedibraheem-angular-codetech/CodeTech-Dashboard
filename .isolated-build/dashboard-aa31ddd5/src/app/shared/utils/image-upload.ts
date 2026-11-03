import { toIsoDate } from './date';

export const IMAGE_UPLOAD_TYPES: readonly string[] = ['image/png', 'image/jpeg'];

export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export const IMAGE_UPLOAD_ACCEPT = 'image/png,image/jpeg';

export interface UploadedImageMeta {
  name: string;
  size: number;

  uploadedAt: string;
}

export type ImageUploadErrorKey = 'home.imageType' | 'home.imageSize';

export type ImageUploadParseResult =
  { ok: true; image: UploadedImageMeta } | { ok: false; errorKey: ImageUploadErrorKey };

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
