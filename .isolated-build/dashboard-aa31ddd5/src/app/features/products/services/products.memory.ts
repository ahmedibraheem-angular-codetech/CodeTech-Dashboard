import { Injectable, inject, signal } from '@angular/core';
import { type Observable, map, of, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import type { PaginatedEnvelope } from '../../../core/http/api.model';
import { ObjectUrls } from '../../../shared/components/product-upload/object-urls';
import type { ProductListDto, ProductListQuery } from '../models/product.api';
import { readMedia, type Product } from '../models/product.model';
import { PRODUCTS_SEED } from './products.mock';
import { PRODUCTS_PAGE_SEED } from './products-page.mock';

/**
 * In-memory products backend for UI/integration specs only.
 * Production uses {@link ProductsService} (HTTP).
 */
@Injectable()
export class ProductsMemoryService {
  private readonly latency = inject(API_LATENCY_MS, { optional: true }) ?? 0;
  private readonly objectUrls = inject(ObjectUrls);
  private readonly state = signal<Product[]>(structuredClone(PRODUCTS_SEED));

  /** Whether product cards show on the public products page. */
  private catalogVisibleState = PRODUCTS_PAGE_SEED.productsVisible;
  readonly catalogVisible = signal(this.catalogVisibleState);

  list(query: ProductListQuery = {}): Observable<Product[]> {
    return timer(this.latency).pipe(map(() => this.filterList(query)));
  }

  listPage(query: ProductListQuery = {}): Observable<PaginatedEnvelope<ProductListDto>> {
    return timer(this.latency).pipe(
      map(() => {
        const items = this.filterList(query);
        const page = query.page ?? 1;
        const perPage = query.perPage ?? (items.length || 100);
        const start = (page - 1) * perPage;
        const slice = items.slice(start, start + perPage);
        const lastPage = Math.max(1, Math.ceil(items.length / perPage));
        return {
          data: slice.map((item, index) => this.toListDto(item, start + index + 1)),
          links: { first: null, last: null, prev: null, next: null },
          meta: {
            current_page: page,
            from: items.length === 0 ? null : start + 1,
            last_page: lastPage,
            path: '',
            per_page: perPage,
            to: items.length === 0 ? null : Math.min(start + slice.length, items.length),
            total: items.length,
          },
        };
      }),
    );
  }

  listAll(query: Omit<ProductListQuery, 'page'> = {}): Observable<Product[]> {
    return this.list(query);
  }

  get(id: string): Observable<Product | null> {
    return timer(this.latency).pipe(
      map(() => {
        const match = this.state().find((item) => item.id === id);
        return match ? structuredClone(match) : null;
      }),
    );
  }

  save(product: Product): Observable<Product> {
    const next: Product = {
      ...structuredClone(product),
      id: product.id || this.newId(),
      code: product.code || product.id || '',
    };
    const previous = this.state().find((item) => item.id === next.id) ?? null;
    this.objectUrls.sync(previous, next);
    this.state.update((items) => {
      const index = items.findIndex((item) => item.id === next.id);
      if (index === -1) {
        return [next, ...items];
      }
      return items.map((item) => (item.id === next.id ? next : item));
    });
    return timer(this.latency).pipe(map(() => structuredClone(next)));
  }

  setPublished(id: string, published: boolean): Observable<Product> {
    let saved: Product | null = null;
    this.state.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }
        saved = { ...item, published };
        return saved;
      }),
    );
    return timer(this.latency).pipe(
      map(() => structuredClone(saved ?? this.state().find((item) => item.id === id)!)),
    );
  }

  remove(id: string): Observable<void> {
    const previous = this.state().find((item) => item.id === id) ?? null;
    this.objectUrls.sync(previous, null);
    this.state.update((items) => items.filter((item) => item.id !== id));
    return timer(this.latency).pipe(map(() => undefined));
  }

  removeListItem(): Observable<never> {
    throw new Error('Not available on memory backend');
  }

  reorder(): Observable<never> {
    throw new Error('Not available on memory backend');
  }

  loadCatalogVisibility(): Observable<boolean> {
    return timer(this.latency).pipe(
      map(() => {
        this.catalogVisible.set(this.catalogVisibleState);
        return this.catalogVisibleState;
      }),
    );
  }

  toggleCatalog(): void {
    this.catalogVisibleState = !this.catalogVisibleState;
    this.catalogVisible.set(this.catalogVisibleState);
  }

  private filterList(query: ProductListQuery): Product[] {
    let items = structuredClone(this.state());
    const search = query.search?.trim().toLowerCase();
    if (search) {
      items = items.filter(
        (item) =>
          item.name.ar.toLowerCase().includes(search) ||
          item.name.en.toLowerCase().includes(search) ||
          item.code.toLowerCase().includes(search),
      );
    }
    if (query.status === 'published') {
      items = items.filter((item) => item.published);
    } else if (query.status === 'draft') {
      items = items.filter((item) => !item.published);
    }
    return items;
  }

  private newId(): string {
    let stamp = Date.now();
    while (this.state().some((item) => item.id === `product-${stamp}`)) {
      stamp += 1;
    }
    return `product-${stamp}`;
  }

  private toListDto(item: Product, fallbackId: number): ProductListDto {
    const numericId = /^\d+$/.test(item.id) ? Number(item.id) : fallbackId;
    const coverUrl = readMedia(item.cover, 'ar').imageUrl;
    const thumbUrl = readMedia(item.thumb, 'ar').imageUrl;
    return {
      id: numericId,
      code: item.code,
      title: { ar: item.name.ar, en: item.name.en },
      description: { ar: item.summary.ar, en: item.summary.en },
      short_description: { ar: item.summary.ar, en: item.summary.en },
      cover: coverUrl ? ({ url: coverUrl } as ProductListDto['cover']) : null,
      thumbnail: thumbUrl ? ({ url: thumbUrl } as ProductListDto['thumbnail']) : null,
      features: item.features.map((feature, sort) => {
        const iconUrl = readMedia(feature.image, 'ar').imageUrl;
        return {
          id: sort + 1,
          title: { ar: feature.title.ar, en: feature.title.en },
          short_description: { ar: feature.body.ar, en: feature.body.en },
          icon: iconUrl ? ({ url: iconUrl } as ProductListDto['features'][0]['icon']) : null,
          sort_order: sort,
        };
      }),
      status: item.published ? 'published' : 'draft',
      slug: item.seo.slug.en || item.seo.slug.ar || null,
      sort_order: fallbackId,
      created_at: '',
      updated_at: '',
    };
  }
}
