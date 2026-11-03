import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import {
  type Observable,
  catchError,
  forkJoin,
  from,
  map,
  of,
  switchMap,
  throwError,
} from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import { statusOf } from '../../../core/http/api-error';
import type { ApiEnvelope, PaginatedEnvelope } from '../../../core/http/api.model';
import { MediaService } from '../../../core/media/media.service';
import type {
  ProductDetailDto,
  ProductListDto,
  ProductListQuery,
  ProductStatusWriteDto,
} from '../models/product.api';
import type {
  ProductsPageDto,
  ProductsPageSectionsWriteDto,
} from '../models/products-page.api';
import type {
  Product,
  ProductImage,
  ProductSector,
  ProductUnit,
} from '../models/product.model';
import {
  isUploadUrl,
  mapProductDetail,
  mapProductListItem,
  toProductWrite,
} from './product.mapper';

const PATH = 'admin/products';
const PAGE_PATH = 'admin/pages/products';

/**
 * Catalog products. List is paginated (`search`, `filter[status]`, `per_page`).
 * Nested lists are embedded on write; media uses coat-check UUIDs (omit/null/set).
 * `catalogVisible` maps to `products_visible` on the products page sections API.
 */
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly media = inject(MediaService);
  private readonly base = inject(API_BASE_URL);

  /** Whether product cards show on the public products page. */
  readonly catalogVisible = signal(false);

  list(query: ProductListQuery = {}): Observable<Product[]> {
    return this.listPage(query).pipe(map((page) => page.data.map(mapProductListItem)));
  }

  listPage(query: ProductListQuery = {}): Observable<PaginatedEnvelope<ProductListDto>> {
    return this.http.get<PaginatedEnvelope<ProductListDto>>(apiUrl(this.base, PATH), {
      params: this.listParams(query),
    });
  }

  /** Loads every page so the board can keep client-side pagination if needed. */
  listAll(query: Omit<ProductListQuery, 'page'> = {}): Observable<Product[]> {
    return this.fetchAll(query);
  }

  get(id: string): Observable<Product | null> {
    return this.http.get<ApiEnvelope<ProductDetailDto>>(apiUrl(this.base, `${PATH}/${id}`)).pipe(
      map((envelope) => mapProductDetail(this.requireDetail(envelope))),
      catchError((error: unknown) => {
        if (statusOf(error) === 404) {
          return of(null);
        }
        return throwError(() => error);
      }),
    );
  }

  save(product: Product): Observable<Product> {
    return this.prepareUploads(product).pipe(
      switchMap((prepared) => {
        const body = toProductWrite(prepared);
        if (!prepared.id) {
          return this.http.post<ApiEnvelope<ProductDetailDto>>(apiUrl(this.base, PATH), body);
        }
        return this.http.put<ApiEnvelope<ProductDetailDto>>(
          apiUrl(this.base, `${PATH}/${prepared.id}`),
          body,
        );
      }),
      map((envelope) => mapProductDetail(this.requireDetail(envelope))),
    );
  }

  setPublished(id: string, published: boolean): Observable<Product> {
    const body: ProductStatusWriteDto = { status: published ? 'published' : 'draft' };
    return this.http
      .patch<ApiEnvelope<ProductDetailDto>>(apiUrl(this.base, `${PATH}/${id}/status`), body)
      .pipe(map((envelope) => mapProductDetail(this.requireDetail(envelope))));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  loadCatalogVisibility(): Observable<boolean> {
    return this.http.get<ApiEnvelope<ProductsPageDto>>(apiUrl(this.base, PAGE_PATH)).pipe(
      map((envelope) => !!envelope?.data?.sections?.products_visible),
      catchError(() => of(this.catalogVisible())),
      map((visible) => {
        this.catalogVisible.set(visible);
        return visible;
      }),
    );
  }

  toggleCatalog(): void {
    const next = !this.catalogVisible();
    this.catalogVisible.set(next);
    const body: ProductsPageSectionsWriteDto = { products_visible: next };
    this.http
      .patch<ApiEnvelope<ProductsPageDto>>(apiUrl(this.base, `${PAGE_PATH}/sections`), body)
      .subscribe({
        error: () => this.catalogVisible.set(!next),
      });
  }

  private fetchAll(query: Omit<ProductListQuery, 'page'>): Observable<Product[]> {
    const perPage = query.perPage ?? 100;
    const loadPage = (page: number, acc: Product[]): Observable<Product[]> =>
      this.listPage({ ...query, page, perPage }).pipe(
        switchMap((envelope) => {
          const chunk = envelope.data.map(mapProductListItem);
          const next = [...acc, ...chunk];
          if (envelope.meta.current_page >= envelope.meta.last_page) {
            return of(next);
          }
          return loadPage(page + 1, next);
        }),
      );
    return loadPage(1, []);
  }

  private listParams(query: ProductListQuery): HttpParams {
    let params = new HttpParams();
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    if (query.status?.trim()) {
      params = params.set('filter[status]', query.status.trim());
    }
    if (query.page) {
      params = params.set('page', String(query.page));
    }
    if (query.perPage) {
      params = params.set('per_page', String(query.perPage));
    }
    return params;
  }

  private prepareUploads(product: Product): Observable<Product> {
    const next = structuredClone(product);
    return forkJoin({
      cover: this.uploadLocalized(next.cover),
      thumb: this.uploadLocalized(next.thumb),
      solution: this.uploadLocalized(next.solution.image),
      features: this.uploadItemImages(next.features),
      stats: this.uploadItemImages(next.stats),
      sectors: this.uploadSectors(next.sectors),
      challenges: this.uploadItemImages(next.challenges),
      offer: this.uploadItemImages(next.offer),
      results: this.uploadItemImages(next.results),
      tools: this.uploadItemImages(next.tools),
      integrations: this.uploadItemImages(next.integrations),
      units: this.uploadUnits(next.units),
      steps: this.uploadItemImages(next.steps),
      identity: this.uploadItemImages(next.identity),
      highlights: this.uploadItemImages(next.highlights),
    }).pipe(
      map((uploaded) => ({
        ...next,
        cover: uploaded.cover,
        thumb: uploaded.thumb,
        solution: { ...next.solution, image: uploaded.solution },
        features: next.features.map((item, index) => ({
          ...item,
          image: uploaded.features[index] ?? item.image,
        })),
        stats: next.stats.map((item, index) => ({
          ...item,
          image: uploaded.stats[index] ?? item.image,
        })),
        sectors: uploaded.sectors,
        challenges: next.challenges.map((item, index) => ({
          ...item,
          image: uploaded.challenges[index] ?? item.image,
        })),
        offer: next.offer.map((item, index) => ({
          ...item,
          image: uploaded.offer[index] ?? item.image,
        })),
        results: next.results.map((item, index) => ({
          ...item,
          image: uploaded.results[index] ?? item.image,
        })),
        tools: next.tools.map((item, index) => ({
          ...item,
          image: uploaded.tools[index] ?? item.image,
        })),
        integrations: next.integrations.map((item, index) => ({
          ...item,
          image: uploaded.integrations[index] ?? item.image,
        })),
        units: uploaded.units,
        steps: next.steps.map((item, index) => ({
          ...item,
          image: uploaded.steps[index] ?? item.image,
        })),
        identity: next.identity.map((item, index) => ({
          ...item,
          image: uploaded.identity[index] ?? item.image,
        })),
        highlights: next.highlights.map((item, index) => ({
          ...item,
          image: uploaded.highlights[index] ?? item.image,
        })),
      })),
    );
  }

  private uploadLocalized(image: Product['cover']): Observable<Product['cover']> {
    return forkJoin({
      ar: this.uploadSlot(image.ar),
      en: this.uploadSlot(image.en),
    });
  }

  private uploadItemImages(
    items: readonly { image: Product['cover'] }[],
  ): Observable<Product['cover'][]> {
    if (items.length === 0) {
      return of([]);
    }
    return forkJoin(items.map((item) => this.uploadLocalized(item.image)));
  }

  private uploadSectors(items: readonly ProductSector[]): Observable<ProductSector[]> {
    if (items.length === 0) {
      return of([]);
    }
    return forkJoin(
      items.map((sector) =>
        this.uploadLocalized(sector.image).pipe(map((image) => ({ ...sector, image }))),
      ),
    );
  }

  private uploadUnits(items: readonly ProductUnit[]): Observable<ProductUnit[]> {
    if (items.length === 0) {
      return of([]);
    }
    return forkJoin(
      items.map((unit) =>
        forkJoin({
          image: this.uploadLocalized(unit.image),
          points: this.uploadItemImages(unit.points),
        }).pipe(
          map(({ image, points }) => ({
            ...unit,
            image,
            points: unit.points.map((point, index) => ({
              ...point,
              image: points[index] ?? point.image,
            })),
          })),
        ),
      ),
    );
  }

  private uploadSlot(image: ProductImage): Observable<ProductImage> {
    if (!isUploadUrl(image.imageUrl)) {
      return of(image);
    }
    return from(this.blobToFile(image.imageUrl, image.imageName || 'image.png')).pipe(
      switchMap((file) => this.media.upload('image', file)),
      map((uploaded) => ({
        imageUuid: uploaded.uuid,
        imageUrl: uploaded.url,
        imageName: uploaded.file_name || uploaded.name || image.imageName || 'image.png',
      })),
    );
  }

  private async blobToFile(url: string, name: string): Promise<File> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to read upload "${name}"`);
    }
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error(`Empty upload "${name}"`);
    }
    return new File([blob], name || 'image.png', { type: blob.type || 'image/png' });
  }

  private requireDetail(envelope: ApiEnvelope<ProductDetailDto>): ProductDetailDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid product response');
    }
    return data;
  }
}
