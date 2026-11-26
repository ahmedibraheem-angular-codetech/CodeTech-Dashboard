import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, forkJoin, map, of, switchMap } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import type { ApiEnvelope, PaginatedEnvelope } from '../../../core/http/api.model';
import {
  type LocalizedFileWriteDto,
  resolveLocalizedMedia,
} from '../../../core/media/localized-media';
import { MediaService } from '../../../core/media/media.service';
import type { TestimonialDto, TestimonialPublishWriteDto } from '../models/review.api';
import type { Review, ReviewContentDraft, ReviewMediaDraft } from '../models/review.model';
import { mapTestimonial, toTestimonialWrite } from './review.mapper';

const PATH = 'admin/testimonials';
const PAGE_SIZE = 100;

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private readonly http = inject(HttpClient);
  private readonly media = inject(MediaService);
  private readonly base = inject(API_BASE_URL);

  list(): Observable<Review[]> {
    return this.fetchAll();
  }

  create(draft: ReviewContentDraft, media: ReviewMediaDraft): Observable<Review> {
    return this.resolveMedia(media).pipe(
      switchMap((resolved) =>
        this.http.post<ApiEnvelope<TestimonialDto>>(
          apiUrl(this.base, PATH),
          toTestimonialWrite(draft, resolved),
        ),
      ),
      map((envelope) => mapTestimonial(this.requireOne(envelope))),
    );
  }

  update(id: string, draft: ReviewContentDraft, media: ReviewMediaDraft): Observable<Review> {
    return this.resolveMedia(media).pipe(
      switchMap((resolved) =>
        this.http.put<ApiEnvelope<TestimonialDto>>(
          apiUrl(this.base, `${PATH}/${id}`),
          toTestimonialWrite(draft, resolved),
        ),
      ),
      map((envelope) => mapTestimonial(this.requireOne(envelope))),
    );
  }

  setPublished(id: string, published: boolean): Observable<Review> {
    const body: TestimonialPublishWriteDto = { is_published: published };
    return this.http
      .patch<ApiEnvelope<TestimonialDto>>(apiUrl(this.base, `${PATH}/${id}/publish`), body)
      .pipe(map((envelope) => mapTestimonial(this.requireOne(envelope))));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(apiUrl(this.base, `${PATH}/export`), {
      responseType: 'blob',
    });
  }

  private resolveMedia(
    media: ReviewMediaDraft,
  ): Observable<{ photo?: LocalizedFileWriteDto; video?: LocalizedFileWriteDto }> {
    return forkJoin({
      photo: resolveLocalizedMedia(this.media, 'image', media.photo),
      video: resolveLocalizedMedia(this.media, 'video', media.video),
    }).pipe(
      map(({ photo, video }) => {
        const resolved: { photo?: LocalizedFileWriteDto; video?: LocalizedFileWriteDto } = {};
        if (photo) {
          resolved.photo = photo;
        }
        if (video) {
          resolved.video = video;
        }
        return resolved;
      }),
    );
  }

  private fetchAll(page = 1, acc: Review[] = []): Observable<Review[]> {
    const params = new HttpParams().set('per_page', String(PAGE_SIZE)).set('page', String(page));
    return this.http
      .get<PaginatedEnvelope<TestimonialDto>>(apiUrl(this.base, PATH), { params })
      .pipe(
        switchMap((envelope) => {
          const batch = this.requireList(envelope).map(mapTestimonial);
          const next = [...acc, ...batch];
          const lastPage = envelope.meta?.last_page ?? 1;
          if (page >= lastPage) {
            return of(next);
          }
          return this.fetchAll(page + 1, next);
        }),
      );
  }

  private requireList(envelope: PaginatedEnvelope<TestimonialDto>): TestimonialDto[] {
    return Array.isArray(envelope?.data) ? envelope.data : [];
  }

  private requireOne(envelope: ApiEnvelope<TestimonialDto>): TestimonialDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid testimonial response');
    }
    return data;
  }
}
