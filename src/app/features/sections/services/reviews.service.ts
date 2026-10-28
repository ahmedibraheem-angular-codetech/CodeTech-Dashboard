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

  create(
    review: Omit<Review, 'id' | 'externalId' | 'createdAt' | 'createdTime'>,
  ): Observable<Review> {
    return timer(this.latency).pipe(
      map(() => {
        const now = new Date();
        const next: Review = {
          ...review,
          id: crypto.randomUUID(),
          externalId: `${Math.floor(100000 + Math.random() * 900000)}`,
          createdAt: now.toISOString().slice(0, 10),
          createdTime: now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
        };
        this.items.update((list) => [next, ...list]);
        return structuredClone(next);
      }),
    );
  }

  update(review: Review): Observable<Review> {
    return timer(this.latency).pipe(
      map(() => {
        const current = this.items().find((item) => item.id === review.id);
        if (!current) {
          throw new Error(`Review not found: ${review.id}`);
        }
        const next: Review = { ...current, ...review };
        this.items.update((list) => list.map((item) => (item.id === review.id ? next : item)));
        return structuredClone(next);
      }),
    );
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
