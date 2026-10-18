import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { type Product } from '../models/product.model';
import { PRODUCTS_SEED } from './products.mock';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly state = signal<Product[]>(structuredClone(PRODUCTS_SEED));
  /** Matches the catalog switch. The list stays visible in both states. */
  readonly catalogVisible = signal(false);

  list(): Observable<Product[]> {
    return timer(this.latency).pipe(map(() => structuredClone(this.state())));
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
      id: product.id || `prd-${Date.now()}`,
    };
    this.state.update((items) => {
      const index = items.findIndex((item) => item.id === next.id);
      if (index === -1) {
        return [next, ...items];
      }
      return items.map((item) => (item.id === next.id ? next : item));
    });
    return timer(this.latency).pipe(map(() => structuredClone(next)));
  }

  remove(id: string): Observable<void> {
    this.state.update((items) => items.filter((item) => item.id !== id));
    return timer(this.latency).pipe(map(() => undefined));
  }

  toggleCatalog(): void {
    this.catalogVisible.update((visible) => !visible);
  }
}
