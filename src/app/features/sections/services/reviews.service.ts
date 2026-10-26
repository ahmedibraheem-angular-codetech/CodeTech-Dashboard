import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import type { Review } from '../models/review.model';
import { REVIEWS_SEED } from './reviews.mock';

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly items = signal<Review[]>(structuredClone(REVIEWS_SEED));

  list(): Observable<Review[]> {
    return timer(this.latency).pipe(map(() => structuredClone(this.items())));
  }

  setPublished(id: string, published: boolean): Observable<Review> {
    return timer(this.latency).pipe(
      map(() => {
        const current = this.items().find((item) => item.id === id);
        if (!current) {
          throw new Error(`Review not found: ${id}`);
        }
        const next: Review = { ...current, published };
        this.items.update((list) => list.map((item) => (item.id === id ? next : item)));
        return structuredClone(next);
      }),
    );
  }

  remove(id: string): Observable<void> {
    return timer(this.latency).pipe(
      map(() => {
        this.items.update((list) => list.filter((item) => item.id !== id));
      }),
    );
  }
}
