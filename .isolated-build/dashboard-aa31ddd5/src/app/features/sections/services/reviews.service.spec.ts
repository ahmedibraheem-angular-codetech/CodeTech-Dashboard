import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/config/api';
import type { FileObject } from '../../../core/http/api.model';
import type { ReviewContentDraft, ReviewMediaDraft } from '../models/review.model';
import { ReviewsService } from './reviews.service';

const LIST = apiUrl(environment.apiUrl, 'admin/testimonials');
const MEDIA = apiUrl(environment.apiUrl, 'admin/media');
const EXPORT = apiUrl(environment.apiUrl, 'admin/testimonials/export');

const fileDto = (overrides: Partial<FileObject> = {}): FileObject => ({
  uuid: 'photo-1',
  name: 'portrait',
  file_name: 'portrait.png',
  mime_type: 'image/png',
  size: 10,
  url: 'https://cdn.test/portrait.png',
  download_url: 'https://cdn.test/download',
  created_at: '2026-11-01T10:00:00.000000Z',
  ...overrides,
});

const testimonial = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  client_name: { ar: `عميل ${id}`, en: `Client ${id}` },
  job_title: { ar: 'دور', en: 'Role' },
  rating: 5,
  comment: { ar: 'تعليق', en: 'Comment' },
  is_published: true,
  sort_order: id,
  photo: fileDto({ uuid: `photo-${id}` }),
  video: null,
  created_at: '2026-11-01T10:00:00.000000Z',
  updated_at: '2026-11-01T10:00:00.000000Z',
  ...overrides,
});

const draft = (overrides: Partial<ReviewContentDraft> = {}): ReviewContentDraft => ({
  rating: 5,
  published: false,
  texts: {
    ar: { name: 'محمد', role: 'مدير', quote: 'رائع' },
    en: { name: 'Mohamed', role: 'Manager', quote: 'Great' },
  },
  ...overrides,
});

const omitMedia = (): ReviewMediaDraft => ({
  photo: { kind: 'omit' },
  video: { kind: 'omit' },
});

describe('ReviewsService', () => {
  let service: ReviewsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReviewsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists testimonials across paginated pages', async () => {
    const result = firstValueFrom(service.list());
    const page1 = http.expectOne((req) => req.url === LIST && req.params.get('page') === '1');
    expect(page1.request.params.get('per_page')).toBe('100');
    page1.flush({
      data: [testimonial(1)],
      links: { first: null, last: null, prev: null, next: null },
      meta: {
        current_page: 1,
        from: 1,
        last_page: 2,
        path: LIST,
        per_page: 100,
        to: 1,
        total: 2,
      },
    });
    const page2 = http.expectOne((req) => req.url === LIST && req.params.get('page') === '2');
    page2.flush({
      data: [testimonial(2, { rating: 4, is_published: false })],
      links: { first: null, last: null, prev: null, next: null },
      meta: {
        current_page: 2,
        from: 2,
        last_page: 2,
        path: LIST,
        per_page: 100,
        to: 2,
        total: 2,
      },
    });
    const rows = await result;
    expect(rows.map((row) => row.id)).toEqual(['1', '2']);
    expect(rows[0]?.texts.en.name).toBe('Client 1');
    expect(rows[1]?.rating).toBe(4);
    expect(rows[1]?.published).toBe(false);
    expect(rows[0]?.photo?.uuid).toBe('photo-1');
  });

  it('creates with bilingual fields and omits media when unchanged intents are omit', async () => {
    const result = firstValueFrom(service.create(draft(), omitMedia()));
    const post = http.expectOne(LIST);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      client_name: { ar: 'محمد', en: 'Mohamed' },
      job_title: { ar: 'مدير', en: 'Manager' },
      comment: { ar: 'رائع', en: 'Great' },
      rating: 5,
      is_published: false,
    });
    expect(post.request.body).not.toHaveProperty('photo');
    expect(post.request.body).not.toHaveProperty('video');
    post.flush({ data: testimonial(9, { is_published: false }) });
    await expect(result).resolves.toMatchObject({ id: '9', published: false });
  });

  it('uploads a photo then POSTs its UUID (never a display URL)', async () => {
    const image = new File(['img'], 'face.png', { type: 'image/png' });
    const result = firstValueFrom(
      service.create(draft(), {
        photo: { kind: 'replace', file: image },
        video: { kind: 'omit' },
      }),
    );
    const upload = http.expectOne(MEDIA);
    expect(upload.request.method).toBe('POST');
    const body = upload.request.body as FormData;
    expect(body.get('type')).toBe('image');
    expect((body.get('file') as File).name).toBe('face.png');
    upload.flush({ data: fileDto({ uuid: 'uploaded-photo' }) });

    const post = http.expectOne(LIST);
    expect(post.request.body.photo).toBe('uploaded-photo');
    expect(post.request.body.photo).not.toContain('http');
    post.flush({
      data: testimonial(3, { photo: fileDto({ uuid: 'uploaded-photo' }) }),
    });
    await expect(result).resolves.toMatchObject({
      id: '3',
      photo: expect.objectContaining({ uuid: 'uploaded-photo' }),
    });
  });

  it('uploads a video with type=video then POSTs its UUID', async () => {
    const video = new File(['vid'], 'clip.mp4', { type: 'video/mp4' });
    const result = firstValueFrom(
      service.create(draft({ rating: 4 }), {
        photo: { kind: 'omit' },
        video: { kind: 'replace', file: video },
      }),
    );
    const upload = http.expectOne(MEDIA);
    const body = upload.request.body as FormData;
    expect(body.get('type')).toBe('video');
    upload.flush({
      data: fileDto({
        uuid: 'uploaded-video',
        name: 'clip',
        file_name: 'clip.mp4',
        mime_type: 'video/mp4',
        url: 'https://cdn.test/clip.mp4',
      }),
    });
    const post = http.expectOne(LIST);
    expect(post.request.body).toMatchObject({
      rating: 4,
      video: 'uploaded-video',
    });
    expect(post.request.body).not.toHaveProperty('photo');
    post.flush({
      data: testimonial(4, {
        rating: 4,
        video: fileDto({ uuid: 'uploaded-video', url: 'https://cdn.test/clip.mp4' }),
      }),
    });
    await expect(result).resolves.toMatchObject({
      id: '4',
      video: expect.objectContaining({ uuid: 'uploaded-video' }),
    });
  });

  it('preserves media on update by omitting photo/video keys', async () => {
    const result = firstValueFrom(service.update('7', draft({ published: true }), omitMedia()));
    const put = http.expectOne(`${LIST}/7`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).not.toHaveProperty('photo');
    expect(put.request.body).not.toHaveProperty('video');
    put.flush({ data: testimonial(7, { is_published: true }) });
    await expect(result).resolves.toMatchObject({ id: '7', published: true });
  });

  it('clears photo with null and can replace video independently', async () => {
    const video = new File(['vid'], 'new.mp4', { type: 'video/mp4' });
    const result = firstValueFrom(
      service.update('7', draft(), {
        photo: { kind: 'clear' },
        video: { kind: 'replace', file: video },
      }),
    );
    http.expectOne(MEDIA).flush({ data: fileDto({ uuid: 'vid-2' }) });
    const put = http.expectOne(`${LIST}/7`);
    expect(put.request.body.photo).toBeNull();
    expect(put.request.body.video).toBe('vid-2');
    put.flush({ data: testimonial(7, { photo: null, video: fileDto({ uuid: 'vid-2' }) }) });
    await expect(result).resolves.toMatchObject({
      photo: null,
      video: expect.objectContaining({ uuid: 'vid-2' }),
    });
  });

  it('publishes via PATCH /admin/testimonials/{id}/publish', async () => {
    const result = firstValueFrom(service.setPublished('7', true));
    const patch = http.expectOne(`${LIST}/7/publish`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ is_published: true });
    patch.flush({ data: testimonial(7, { is_published: true }) });
    await expect(result).resolves.toMatchObject({ id: '7', published: true });
  });

  it('deletes a testimonial', async () => {
    const result = firstValueFrom(service.remove('7'));
    const del = http.expectOne(`${LIST}/7`);
    expect(del.request.method).toBe('DELETE');
    del.flush('', { status: 204, statusText: 'No Content' });
    await expect(result).resolves.toBeUndefined();
  });

  it('exports CSV as a blob', async () => {
    const result = firstValueFrom(service.exportCsv());
    const req = http.expectOne(EXPORT);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['id,name\n'], { type: 'text/csv' }));
    const blob = await result;
    expect(blob.type).toContain('text/csv');
  });

  it('surfaces list HTTP failures', async () => {
    const result = firstValueFrom(service.list()).catch((error: unknown) => error);
    http.expectOne((req) => req.url === LIST && req.params.get('page') === '1').flush('nope', {
      status: 500,
      statusText: 'Server Error',
    });
    expect(await result).toBeTruthy();
  });

  it('surfaces media upload failures before writing the testimonial', async () => {
    const image = new File(['img'], 'face.png', { type: 'image/png' });
    const result = firstValueFrom(
      service.create(draft(), {
        photo: { kind: 'replace', file: image },
        video: { kind: 'omit' },
      }),
    ).catch((error: unknown) => error);
    http.expectOne(MEDIA).flush('fail', { status: 422, statusText: 'Unprocessable' });
    expect(await result).toBeTruthy();
    http.expectNone(LIST);
  });
});
