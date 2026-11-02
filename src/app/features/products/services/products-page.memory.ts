import { Injectable, inject } from '@angular/core';
import { type Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { ObjectUrls } from '../../../shared/components/product-upload/object-urls';
import type {
  ProductsPageContent,
  ProductsPageFeature,
  ProductsPageSector,
} from '../models/products-page.model';
import { PRODUCTS_PAGE_SEED } from './products-page.mock';

/**
 * In-memory products page backend for UI/integration specs only.
 * Production uses {@link ProductsPageService} (HTTP).
 */
@Injectable()
export class ProductsPageMemoryService {
  private readonly latency = inject(API_LATENCY_MS, { optional: true }) ?? 0;
  private readonly objectUrls = inject(ObjectUrls);
  private state = structuredClone(PRODUCTS_PAGE_SEED);

  get(): Observable<ProductsPageContent> {
    return timer(this.latency).pipe(map(() => structuredClone(this.state)));
  }

  toggleFeatures(enabled: boolean): Observable<ProductsPageContent> {
    this.state = { ...this.state, featuresEnabled: enabled };
    return this.get();
  }

  toggleSectors(enabled: boolean): Observable<ProductsPageContent> {
    this.state = { ...this.state, sectorsEnabled: enabled };
    return this.get();
  }

  toggleProductsVisible(visible: boolean): Observable<ProductsPageContent> {
    this.state = { ...this.state, productsVisible: visible };
    return this.get();
  }

  saveFeature(feature: ProductsPageFeature): Observable<ProductsPageFeature> {
    const next = structuredClone(feature);
    if (!next.id) {
      next.id = this.newId('page-feature');
    }
    const previous =
      this.state.features.find((item) => item.id === next.id) ?? null;
    this.objectUrls.sync(previous, next);
    this.state = {
      ...this.state,
      features: this.upsert(this.state.features, next),
    };
    return timer(this.latency).pipe(map(() => structuredClone(next)));
  }

  removeFeature(id: string): Observable<void> {
    const previous = this.state.features.find((item) => item.id === id) ?? null;
    this.objectUrls.sync(previous, null);
    this.state = {
      ...this.state,
      features: this.state.features.filter((item) => item.id !== id),
    };
    return timer(this.latency).pipe(map(() => undefined));
  }

  saveSector(sector: ProductsPageSector): Observable<ProductsPageSector> {
    const next = structuredClone(sector);
    if (!next.id) {
      next.id = this.newId('page-sector');
    }
    const previous = this.state.sectors.find((item) => item.id === next.id) ?? null;
    this.objectUrls.sync(previous, next);
    this.state = {
      ...this.state,
      sectors: this.upsert(this.state.sectors, next),
    };
    return timer(this.latency).pipe(map(() => structuredClone(next)));
  }

  removeSector(id: string): Observable<void> {
    const previous = this.state.sectors.find((item) => item.id === id) ?? null;
    this.objectUrls.sync(previous, null);
    this.state = {
      ...this.state,
      sectors: this.state.sectors.filter((item) => item.id !== id),
    };
    return timer(this.latency).pipe(map(() => undefined));
  }

  private upsert<T extends { id: string }>(items: readonly T[], next: T): T[] {
    const index = items.findIndex((item) => item.id === next.id);
    if (index === -1) {
      return [...items, next];
    }
    return items.map((item) => (item.id === next.id ? next : item));
  }

  private newId(prefix: string): string {
    let stamp = Date.now();
    while (
      this.state.features.some((item) => item.id === `${prefix}-${stamp}`) ||
      this.state.sectors.some((item) => item.id === `${prefix}-${stamp}`)
    ) {
      stamp += 1;
    }
    return `${prefix}-${stamp}`;
  }
}
