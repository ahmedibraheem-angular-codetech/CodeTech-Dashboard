import { mapLocalizedMedia } from '../../../core/media/localized-media';
import type { LocalizedFileWriteDto } from '../../../core/media/localized-media';
import type { TestimonialDto, TestimonialWriteDto } from '../models/review.api';
import type { Review, ReviewContentDraft } from '../models/review.model';

export function mapTestimonial(dto: TestimonialDto): Review {
  return {
    id: String(dto.id),
    externalId: String(dto.id).padStart(6, '0'),
    rating: dto.rating,
    published: dto.is_published,
    photo: mapLocalizedMedia(dto.photo),
    video: mapLocalizedMedia(dto.video),
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
  media: { photo?: LocalizedFileWriteDto | null; video?: LocalizedFileWriteDto | null },
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
