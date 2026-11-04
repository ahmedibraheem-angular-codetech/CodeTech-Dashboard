import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import { isApiError, statusOf, toApiError } from '../../../core/http/api-error';
import type { ApiEnvelope, PaginatedEnvelope } from '../../../core/http/api.model';
import { MediaService } from '../../../core/media/media.service';
import type {
  ArticleCategoryDto,
  ArticleCategoryPublishWriteDto,
  ArticleDetailDto,
  ArticleFeatureWriteDto,
  ArticleListDto,
  ArticleStatsDto,
  ArticleStatusWriteDto,
} from '../models/knowledge.api';
import {
  CategoryInUseError,
  type Article,
  type ArticleCategory,
  type ArticleCategoryDraft,
  type ArticleDraft,
  type ArticleListQuery,
  type ArticleMediaDraft,
  type ArticleStats,
  type ArticleStatus,
  type KnowledgeMediaIntent,
} from '../models/knowledge.model';
import {
  mapArticleCategory,
  mapArticleDetail,
  mapArticleListItem,
  mapArticleStats,
  toArticleCategoryWrite,
  toArticleWrite,
} from './knowledge.mapper';

export { CategoryInUseError };

const CATEGORIES_PATH = 'admin/article-categories';
const ARTICLES_PATH = 'admin/articles';
const PAGE_SIZE = 100;

/**
 * Knowledge Center articles & categories.
 * Article list is fetched across pages so the board can keep client-side
 * search/status/date filtering. Category reorder is unused — the UI has no handle.
 * Media uses coat-check: omit to keep, null to remove, UUID to set.
 * Rich-text images use MediaService.uploadEditorImage (URL into HTML, not UUID).
 */
@Injectable({ providedIn: 'root' })
export class KnowledgeService {
  private readonly http = inject(HttpClient);
  private readonly media = inject(MediaService);
  private readonly base = inject(API_BASE_URL);

  list(): Observable<Article[]> {
    return this.fetchAllArticles();
  }

  listPage(query: ArticleListQuery = {}): Observable<PaginatedEnvelope<ArticleListDto>> {
    return this.http.get<PaginatedEnvelope<ArticleListDto>>(apiUrl(this.base, ARTICLES_PATH), {
      params: this.articleParams(query),
    });
  }

  stats(): Observable<ArticleStats> {
    return this.http
      .get<ApiEnvelope<ArticleStatsDto>>(apiUrl(this.base, `${ARTICLES_PATH}/stats`))
      .pipe(map((envelope) => mapArticleStats(this.requireStats(envelope))));
  }

  get(id: string): Observable<Article | null> {
    return this.http
      .get<ApiEnvelope<ArticleDetailDto>>(apiUrl(this.base, `${ARTICLES_PATH}/${id}`))
      .pipe(
        map((envelope) => mapArticleDetail(this.requireArticle(envelope))),
        catchError((error: unknown) => {
          if (statusOf(error) === 404) {
            return of(null);
          }
          return throwError(() => error);
        }),
      );
  }

  create(draft: ArticleDraft, media: ArticleMediaDraft): Observable<Article> {
    return this.resolveMedia(media).pipe(
      switchMap((resolved) =>
        this.http.post<ApiEnvelope<ArticleDetailDto>>(
          apiUrl(this.base, ARTICLES_PATH),
          toArticleWrite(draft, media, resolved),
        ),
      ),
      map((envelope) => mapArticleDetail(this.requireArticle(envelope))),
    );
  }

  update(id: string, draft: ArticleDraft, media: ArticleMediaDraft): Observable<Article> {
    return this.resolveMedia(media).pipe(
      switchMap((resolved) =>
        this.http.put<ApiEnvelope<ArticleDetailDto>>(
          apiUrl(this.base, `${ARTICLES_PATH}/${id}`),
          toArticleWrite(draft, media, resolved),
        ),
      ),
      map((envelope) => mapArticleDetail(this.requireArticle(envelope))),
    );
  }

  setStatus(id: string, status: ArticleStatus): Observable<Article> {
    const body: ArticleStatusWriteDto = { status };
    return this.http
      .patch<ApiEnvelope<ArticleDetailDto>>(
        apiUrl(this.base, `${ARTICLES_PATH}/${id}/status`),
        body,
      )
      .pipe(map((envelope) => mapArticleDetail(this.requireArticle(envelope))));
  }

  setFeatured(id: string, featured: boolean): Observable<Article> {
    const body: ArticleFeatureWriteDto = { is_featured: featured };
    return this.http
      .patch<ApiEnvelope<ArticleDetailDto>>(
        apiUrl(this.base, `${ARTICLES_PATH}/${id}/feature`),
        body,
      )
      .pipe(map((envelope) => mapArticleDetail(this.requireArticle(envelope))));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${ARTICLES_PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(apiUrl(this.base, `${ARTICLES_PATH}/export`), {
      responseType: 'blob',
    });
  }

  listCategories(): Observable<ArticleCategory[]> {
    return this.http
      .get<ApiEnvelope<ArticleCategoryDto[]>>(apiUrl(this.base, CATEGORIES_PATH))
      .pipe(map((envelope) => this.requireCategories(envelope).map(mapArticleCategory)));
  }

  createCategory(draft: ArticleCategoryDraft): Observable<ArticleCategory> {
    return this.http
      .post<ApiEnvelope<ArticleCategoryDto>>(
        apiUrl(this.base, CATEGORIES_PATH),
        toArticleCategoryWrite(draft),
      )
      .pipe(map((envelope) => mapArticleCategory(this.requireCategory(envelope))));
  }

  updateCategory(id: string, draft: ArticleCategoryDraft): Observable<ArticleCategory> {
    return this.http
      .put<ApiEnvelope<ArticleCategoryDto>>(
        apiUrl(this.base, `${CATEGORIES_PATH}/${id}`),
        toArticleCategoryWrite(draft),
      )
      .pipe(map((envelope) => mapArticleCategory(this.requireCategory(envelope))));
  }

  setCategoryPublished(id: string, published: boolean): Observable<ArticleCategory> {
    const body: ArticleCategoryPublishWriteDto = { is_published: published };
    return this.http
      .patch<ApiEnvelope<ArticleCategoryDto>>(
        apiUrl(this.base, `${CATEGORIES_PATH}/${id}/publish`),
        body,
      )
      .pipe(map((envelope) => mapArticleCategory(this.requireCategory(envelope))));
  }

  removeCategory(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${CATEGORIES_PATH}/${id}`), { responseType: 'text' })
      .pipe(
        map(() => undefined),
        catchError((error: unknown) =>
          throwError(() => this.normalizeCategoryDeleteError(this.normalizeHttpError(error), id)),
        ),
      );
  }

  exportCategoriesCsv(): Observable<Blob> {
    return this.http.get(apiUrl(this.base, `${CATEGORIES_PATH}/export`), {
      responseType: 'blob',
    });
  }

  private normalizeHttpError(error: unknown): unknown {
    return error instanceof HttpErrorResponse ? toApiError(error) : error;
  }

  private normalizeCategoryDeleteError(error: unknown, id: string): unknown {
    if (!isApiError(error)) {
      return error;
    }
    if (error.kind === 'conflict' || this.looksLikeCategoryInUse(error)) {
      return new CategoryInUseError(id);
    }
    return error;
  }

  private looksLikeCategoryInUse(error: {
    serverMessage: string | null;
    fieldErrors: Record<string, readonly string[]>;
  }): boolean {
    const haystack = [error.serverMessage ?? '', ...Object.values(error.fieldErrors).flat()]
      .join(' ')
      .toLowerCase();
    return (
      haystack.includes('in use') ||
      haystack.includes('articles') ||
      haystack.includes('مقال') ||
      haystack.includes('مستخدم')
    );
  }

  private resolveMedia(
    media: ArticleMediaDraft,
  ): Observable<{ cover?: string | null; thumbnail?: string | null; authorPhoto?: string | null }> {
    return forkJoin({
      cover: this.resolveField(media.cover),
      thumbnail: this.resolveField(media.thumbnail),
      authorPhoto: this.resolveField(media.authorPhoto),
    }).pipe(
      map(({ cover, thumbnail, authorPhoto }) => {
        const resolved: {
          cover?: string | null;
          thumbnail?: string | null;
          authorPhoto?: string | null;
        } = {};
        if (cover !== undefined) {
          resolved.cover = cover;
        }
        if (thumbnail !== undefined) {
          resolved.thumbnail = thumbnail;
        }
        if (authorPhoto !== undefined) {
          resolved.authorPhoto = authorPhoto;
        }
        return resolved;
      }),
    );
  }

  private resolveField(intent: KnowledgeMediaIntent): Observable<string | null | undefined> {
    if (intent.kind === 'omit') {
      return of(undefined);
    }
    if (intent.kind === 'clear') {
      return of(null);
    }
    return this.media.upload('image', intent.file).pipe(map((file) => file.uuid));
  }

  private articleParams(query: ArticleListQuery): HttpParams {
    let params = new HttpParams()
      .set('per_page', String(query.perPage ?? PAGE_SIZE))
      .set('page', String(query.page ?? 1));
    const search = query.search?.trim();
    if (search) {
      params = params.set('search', search);
    }
    if (query.status && query.status !== 'all') {
      params = params.set('filter[status]', query.status);
    }
    if (query.categoryId && query.categoryId !== 'all') {
      params = params.set('filter[category]', query.categoryId);
    }
    if (query.featured === true) {
      params = params.set('filter[featured]', '1');
    } else if (query.featured === false) {
      params = params.set('filter[featured]', '0');
    }
    if (query.from) {
      params = params.set('filter[from]', query.from);
    }
    if (query.to) {
      params = params.set('filter[to]', query.to);
    }
    return params;
  }

  private fetchAllArticles(page = 1, acc: Article[] = []): Observable<Article[]> {
    return this.listPage({ page, perPage: PAGE_SIZE }).pipe(
      switchMap((envelope) => {
        const batch = this.requireArticles(envelope).map(mapArticleListItem);
        const next = [...acc, ...batch];
        const lastPage = envelope.meta?.last_page ?? 1;
        if (page >= lastPage) {
          return of(next);
        }
        return this.fetchAllArticles(page + 1, next);
      }),
    );
  }

  private requireCategories(envelope: ApiEnvelope<ArticleCategoryDto[]>): ArticleCategoryDto[] {
    return Array.isArray(envelope?.data) ? envelope.data : [];
  }

  private requireCategory(envelope: ApiEnvelope<ArticleCategoryDto>): ArticleCategoryDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid article category response');
    }
    return data;
  }

  private requireArticles(envelope: PaginatedEnvelope<ArticleListDto>): ArticleListDto[] {
    return Array.isArray(envelope?.data) ? envelope.data : [];
  }

  private requireArticle(envelope: ApiEnvelope<ArticleDetailDto>): ArticleDetailDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid article response');
    }
    return data;
  }

  private requireStats(envelope: ApiEnvelope<ArticleStatsDto>): ArticleStatsDto {
    const data = envelope?.data;
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid article stats response');
    }
    return data;
  }
}
