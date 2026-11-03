import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map, of, switchMap } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import type { ApiEnvelope, PaginatedEnvelope } from '../../../core/http/api.model';
import type { FaqCategoryDto, FaqDto, FaqPublishWriteDto } from '../models/faq.api';
import type {
  FaqCategory,
  FaqCategoryDraft,
  FaqDraft,
  FaqItem,
} from '../models/faq.model';
import { mapFaq, mapFaqCategory, toFaqCategoryWrite, toFaqWrite } from './faq.mapper';

const CATEGORIES_PATH = 'admin/faq-categories';
const FAQS_PATH = 'admin/faqs';
const PAGE_SIZE = 100;

@Injectable({ providedIn: 'root' })
export class FaqService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  listCategories(): Observable<FaqCategory[]> {
    return this.http
      .get<ApiEnvelope<FaqCategoryDto[]>>(apiUrl(this.base, CATEGORIES_PATH))
      .pipe(map((envelope) => this.requireCategories(envelope).map(mapFaqCategory)));
  }

  list(): Observable<FaqItem[]> {
    return this.fetchAllFaqs();
  }

  createCategory(draft: FaqCategoryDraft): Observable<FaqCategory> {
    return this.http
      .post<ApiEnvelope<FaqCategoryDto>>(
        apiUrl(this.base, CATEGORIES_PATH),
        toFaqCategoryWrite(draft),
      )
      .pipe(map((envelope) => mapFaqCategory(this.requireCategory(envelope))));
  }

  updateCategory(id: string, draft: FaqCategoryDraft): Observable<FaqCategory> {
    return this.http
      .put<ApiEnvelope<FaqCategoryDto>>(
        apiUrl(this.base, `${CATEGORIES_PATH}/${id}`),
        toFaqCategoryWrite(draft),
      )
      .pipe(map((envelope) => mapFaqCategory(this.requireCategory(envelope))));
  }

  removeCategory(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${CATEGORIES_PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  setCategoryPublished(id: string, published: boolean): Observable<FaqCategory> {
    const body: FaqPublishWriteDto = { is_published: published };
    return this.http
      .patch<ApiEnvelope<FaqCategoryDto>>(
        apiUrl(this.base, `${CATEGORIES_PATH}/${id}/publish`),
        body,
      )
      .pipe(map((envelope) => mapFaqCategory(this.requireCategory(envelope))));
  }

  create(draft: FaqDraft): Observable<FaqItem> {
    return this.http
      .post<ApiEnvelope<FaqDto>>(apiUrl(this.base, FAQS_PATH), toFaqWrite(draft))
      .pipe(map((envelope) => mapFaq(this.requireFaq(envelope))));
  }

  update(id: string, draft: FaqDraft): Observable<FaqItem> {
    return this.http
      .put<ApiEnvelope<FaqDto>>(apiUrl(this.base, `${FAQS_PATH}/${id}`), toFaqWrite(draft))
      .pipe(map((envelope) => mapFaq(this.requireFaq(envelope))));
  }

  setPublished(id: string, published: boolean): Observable<FaqItem> {
    const body: FaqPublishWriteDto = { is_published: published };
    return this.http
      .patch<ApiEnvelope<FaqDto>>(apiUrl(this.base, `${FAQS_PATH}/${id}/publish`), body)
      .pipe(map((envelope) => mapFaq(this.requireFaq(envelope))));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${FAQS_PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  private fetchAllFaqs(page = 1, acc: FaqItem[] = []): Observable<FaqItem[]> {
    const params = new HttpParams().set('per_page', String(PAGE_SIZE)).set('page', String(page));
    return this.http
      .get<PaginatedEnvelope<FaqDto>>(apiUrl(this.base, FAQS_PATH), { params })
      .pipe(
        switchMap((envelope) => {
          const batch = this.requireFaqs(envelope).map(mapFaq);
          const next = [...acc, ...batch];
          const lastPage = envelope.meta?.last_page ?? 1;
          if (page >= lastPage) {
            return of(next);
          }
          return this.fetchAllFaqs(page + 1, next);
        }),
      );
  }

  private requireCategories(envelope: ApiEnvelope<FaqCategoryDto[]>): FaqCategoryDto[] {
    const data = envelope?.data;
    return Array.isArray(data) ? data : [];
  }

  private requireCategory(envelope: ApiEnvelope<FaqCategoryDto>): FaqCategoryDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid FAQ category response');
    }
    return data;
  }

  private requireFaqs(envelope: PaginatedEnvelope<FaqDto>): FaqDto[] {
    const data = envelope?.data;
    return Array.isArray(data) ? data : [];
  }

  private requireFaq(envelope: ApiEnvelope<FaqDto>): FaqDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number' || !data.category || typeof data.category.id !== 'number') {
      throw new Error('Invalid FAQ response');
    }
    return data;
  }
}
