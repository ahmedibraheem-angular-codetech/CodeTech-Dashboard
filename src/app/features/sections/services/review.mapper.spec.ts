import { describe, expect, it } from 'vitest';

import type { FileObject } from '../../../core/http/api.model';
import type { TestimonialDto } from '../models/review.api';
import { mapReviewMedia, mapTestimonial, toTestimonialWrite } from './review.mapper';

const file = (overrides: Partial<FileObject> = {}): FileObject => ({
  uuid: 'photo-uuid',
  name: 'portrait',
  file_name: 'portrait.png',
  mime_type: 'image/png',
  size: 1200,
  url: 'https://cdn.test/portrait.png',
  download_url: 'https://cdn.test/download',
  created_at: '2026-10-29T10:00:00.000000Z',
  ...overrides,
});

const dto = (overrides: Partial<TestimonialDto> = {}): TestimonialDto => ({
  id: 7,
  client_name: { ar: 'محمد', en: 'Mohamed' },
  job_title: { ar: 'مدير', en: 'Manager' },
  rating: 5,
  comment: { ar: 'رائع', en: 'Great' },
  is_published: true,
  sort_order: 2,
  photo: file(),
  video: file({
    uuid: 'video-uuid',
    name: 'clip',
    file_name: 'clip.mp4',
    mime_type: 'video/mp4',
    url: 'https://cdn.test/clip.mp4',
  }),
  created_at: '2026-10-29T12:00:00.000000Z',
  updated_at: '2026-10-29T13:00:00.000000Z',
  ...overrides,
});

describe('review.mapper', () => {
  it('maps bilingual fields, media files, rating, and padded external id', () => {
    expect(mapTestimonial(dto())).toEqual({
      id: '7',
      externalId: '000007',
      rating: 5,
      published: true,
      photo: {
        uuid: 'photo-uuid',
        url: 'https://cdn.test/portrait.png',
        name: 'portrait',
        fileName: 'portrait.png',
        size: 1200,
      },
      video: {
        uuid: 'video-uuid',
        url: 'https://cdn.test/clip.mp4',
        name: 'clip',
        fileName: 'clip.mp4',
        size: 1200,
      },
      createdAt: '2026-10-29T12:00:00.000000Z',
      sortOrder: 2,
      texts: {
        ar: { name: 'محمد', role: 'مدير', quote: 'رائع' },
        en: { name: 'Mohamed', role: 'Manager', quote: 'Great' },
      },
    });
  });

  it('maps null locale strings and nullable media to empty / null', () => {
    const mapped = mapTestimonial(
      dto({
        client_name: { ar: 'علي', en: null },
        job_title: null,
        comment: { ar: null, en: 'Ok' },
        photo: null,
        video: null,
        is_published: false,
        rating: 3,
      }),
    );
    expect(mapped.texts).toEqual({
      ar: { name: 'علي', role: '', quote: '' },
      en: { name: '', role: '', quote: 'Ok' },
    });
    expect(mapped.photo).toBeNull();
    expect(mapped.video).toBeNull();
    expect(mapped.published).toBe(false);
    expect(mapped.rating).toBe(3);
  });

  it('rejects media objects that only have a url (never treat url as uuid)', () => {
    expect(mapReviewMedia({ url: 'https://cdn.test/x.png' } as FileObject)).toBeNull();
    expect(mapReviewMedia(file({ uuid: undefined as unknown as string }))).toBeNull();
  });

  it('writes bilingual body and omits media keys when unresolved', () => {
    expect(
      toTestimonialWrite(
        {
          rating: 4,
          published: false,
          texts: {
            ar: { name: ' محمد ', role: ' مدير ', quote: ' نص ' },
            en: { name: ' Mohamed ', role: ' Manager ', quote: ' Text ' },
          },
        },
        {},
      ),
    ).toEqual({
      client_name: { ar: 'محمد', en: 'Mohamed' },
      job_title: { ar: 'مدير', en: 'Manager' },
      comment: { ar: 'نص', en: 'Text' },
      rating: 4,
      is_published: false,
    });
  });

  it('sends null job_title when both roles are empty and includes media UUID/null', () => {
    expect(
      toTestimonialWrite(
        {
          rating: 1,
          published: true,
          texts: {
            ar: { name: 'أ', role: '  ', quote: 'ق' },
            en: { name: 'A', role: '', quote: 'Q' },
          },
        },
        { photo: 'new-photo', video: null },
      ),
    ).toEqual({
      client_name: { ar: 'أ', en: 'A' },
      job_title: null,
      comment: { ar: 'ق', en: 'Q' },
      rating: 1,
      is_published: true,
      photo: 'new-photo',
      video: null,
    });
  });
});
