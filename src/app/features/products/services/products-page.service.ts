import { Injectable, inject, signal } from '@angular/core';
import { type Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import type {
  ProductsPageContent,
  ProductsPageFeature,
  ProductsPageSector,
} from '../models/products-page.model';
import { PRODUCTS_PAGE_SEED } from './products-page.mock';

@Injectable({ providedIn: 'root' })
export class ProductsPageService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly state = signal<ProductsPageContent>(structuredClone(PRODUCTS_PAGE_SEED));

  get(): Observable<ProductsPageContent> {
    return timer(this.latency).pipe(map(() => structuredClone(this.state())));
  }

  toggleFeatures(enabled: boolean): void {
    this.state.update((current) => ({ ...current, featuresEnabled: enabled }));
  }

  toggleSectors(enabled: boolean): void {
    this.state.update((current) => ({ ...current, sectorsEnabled: enabled }));
  }

  saveFeature(feature: ProductsPageFeature): Observable<ProductsPageFeature> {
    const next = structuredClone(feature);
    this.state.update((current) => {
      const index = current.features.findIndex((item) => item.id === next.id);
      const features =
        index === -1
          ? [...current.features, next]
          : current.features.map((item) => (item.id === next.id ? next : item));
      return { ...current, features };
    });
    return timer(this.latency).pipe(map(() => structuredClone(next)));
  }

  removeFeature(id: string): Observable<void> {
    this.state.update((current) => ({
      ...current,
      features: current.features.filter((item) => item.id !== id),
    }));
    return timer(this.latency).pipe(map(() => undefined));
  }

  saveSector(sector: ProductsPageSector): Observable<ProductsPageSector> {
    const next = structuredClone(sector);
    this.state.update((current) => {
      const index = current.sectors.findIndex((item) => item.id === next.id);
      const sectors =
        index === -1
          ? [...current.sectors, next]
          : current.sectors.map((item) => (item.id === next.id ? next : item));
      return { ...current, sectors };
    });
    return timer(this.latency).pipe(map(() => structuredClone(next)));
  }

  removeSector(id: string): Observable<void> {
    this.state.update((current) => ({
      ...current,
      sectors: current.sectors.filter((item) => item.id !== id),
    }));
    return timer(this.latency).pipe(map(() => undefined));
  }
}
