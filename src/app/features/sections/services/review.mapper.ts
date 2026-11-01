import type { FileObject } from '../../../core/http/api.model';
import type { TestimonialDto, TestimonialWriteDto } from '../models/review.api';
import type { Review, ReviewContentDraft, ReviewMediaFile } from '../models/review.model';

export function mapReviewMedia(value: FileObject | null | undefined): ReviewMediaFile | null {
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

export function mapTestimonial(dto: TestimonialDto): Review {
  return {
    id: String(dto.id),
    externalId: String(dto.id).padStart(6, '0'),
    rating: dto.rating,
    published: dto.is_published,
    photo: mapReviewMedia(dto.photo),
    video: mapReviewMedia(dto.video),
    createdAt: dto.created_at,
    sortOrder: dto.sort_order,
    texts: {
      ar: {
        name: dto.client_name?.ar ?? '',
        role: dto.job_title?.ar ?? '',
        quote: dto.comment?.ar ?? '',
      },
      en: {
        name: dto.client_name?.en ?? '',
        role: dto.job_title?.en ?? '',
        quote: dto.comment?.en ?? '',
      },
    },
  };
}

export function toTestimonialWrite(
  draft: ReviewContentDraft,
  media: { photo?: string | null; video?: string | null },
): TestimonialWriteDto {
  const jobAr = draft.texts.ar.role.trim();
  const jobEn = draft.texts.en.role.trim();
  const body: TestimonialWriteDto = {
    client_name: {
      ar: draft.texts.ar.name.trim(),
      en: draft.texts.en.name.trim(),
    },
    comment: {
      ar: draft.texts.ar.quote.trim(),
      en: draft.texts.en.quote.trim(),
    },
    rating: draft.rating,
    is_published: draft.published,
    job_title: jobAr || jobEn ? { ar: jobAr, en: jobEn } : null,
  };
  if (media.photo !== undefined) {
    body.photo = media.photo;
  }
  if (media.video !== undefined) {
    body.video = media.video;
  }
  return body;
}
