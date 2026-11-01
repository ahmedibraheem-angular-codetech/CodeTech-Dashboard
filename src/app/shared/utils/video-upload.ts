import { toIsoDate } from './date';

export const VIDEO_UPLOAD_TYPES: readonly string[] = ['video/mp4'];

export const VIDEO_UPLOAD_MAX_BYTES = 35 * 1024 * 1024;

export const VIDEO_UPLOAD_ACCEPT = 'video/mp4';

export interface UploadedVideoMeta {
  name: string;
  size: number;

  uploadedAt: string;
}

export type VideoUploadErrorKey = 'review.videoType' | 'review.videoSize';

export type VideoUploadParseResult =
  { ok: true; video: UploadedVideoMeta } | { ok: false; errorKey: VideoUploadErrorKey };

export function parseUploadedVideo(
  file: File | undefined,
  clock: () => Date = () => new Date(),
): VideoUploadParseResult | null {
  if (!file) {
    return null;
  }
  if (!VIDEO_UPLOAD_TYPES.includes(file.type)) {
    return { ok: false, errorKey: 'review.videoType' };
  }
  if (file.size > VIDEO_UPLOAD_MAX_BYTES) {
    return { ok: false, errorKey: 'review.videoSize' };
  }
  return {
    ok: true,
    video: {
      name: file.name,
      size: file.size,
      uploadedAt: toIsoDate(clock()),
    },
  };
}
