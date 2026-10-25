import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { toIsoDate } from '../../../shared/utils/date';
import type { FaqCategory, FaqCategoryDraft, FaqDraft, FaqItem } from '../models/faq.model';
import { FAQ_CATEGORIES_SEED, FAQ_ITEMS_SEED } from './faq.mock';

@Injectable({ providedIn: 'root' })
export class FaqService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly items = signal<FaqItem[]>(structuredClone(FAQ_ITEMS_SEED));
  private readonly categories = signal<FaqCategory[]>(structuredClone(FAQ_CATEGORIES_SEED));

  list(): Observable<FaqItem[]> {
    return timer(this.latency).pipe(map(() => structuredClone(this.items())));
  }

  listCategories(): Observable<FaqCategory[]> {
    return timer(this.latency).pipe(map(() => structuredClone(this.categories())));
  }

  createCategory(draft: FaqCategoryDraft): Observable<FaqCategory> {
    return timer(this.latency).pipe(
      map(() => {
        const category: FaqCategory = {
          ...structuredClone(draft),
          id: `cat${crypto.randomUUID().slice(0, 8)}`,
        };
        this.categories.update((list) => [...list, category]);
        return structuredClone(category);
      }),
    );
  }

  updateCategory(id: string, draft: FaqCategoryDraft): Observable<FaqCategory> {
    return timer(this.latency).pipe(
      map(() => {
        const current = this.categories().find((item) => item.id === id);
        if (!current) {
          throw new Error('missing-category');
        }
        const next: FaqCategory = { ...structuredClone(draft), id: current.id };
        this.categories.update((list) => list.map((item) => (item.id === id ? next : item)));
        return structuredClone(next);
      }),
    );
  }

  removeCategory(id: string): Observable<void> {
    return timer(this.latency).pipe(
      map(() => {
        this.categories.update((list) => list.filter((item) => item.id !== id));
      }),
    );
  }

  create(draft: FaqDraft): Observable<FaqItem> {
    return timer(this.latency).pipe(
      map(() => {
        const item: FaqItem = {
          ...structuredClone(draft),
          id: `fq${crypto.randomUUID().slice(0, 8)}`,
          updatedAt: draft.updatedAt || toIsoDate(new Date()),
        };
        this.items.update((list) => [item, ...list]);
        return structuredClone(item);
      }),
    );
  }

  update(id: string, draft: FaqDraft): Observable<FaqItem> {
    return timer(this.latency).pipe(
      map(() => {
        const current = this.items().find((item) => item.id === id);
        if (!current) {
          throw new Error('missing-faq');
        }
        const next: FaqItem = {
          ...structuredClone(draft),
          id,
          updatedAt: toIsoDate(new Date()),
        };
        this.items.update((list) => list.map((item) => (item.id === id ? next : item)));
        return structuredClone(next);
      }),
    );
  }

  setPublished(id: string, published: boolean): Observable<FaqItem> {
    return timer(this.latency).pipe(
      map(() => {
        const current = this.items().find((item) => item.id === id);
        if (!current) {
          throw new Error('missing-faq');
        }
        const next: FaqItem = { ...current, published, updatedAt: toIsoDate(new Date()) };
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

  setCategoryPublished(id: string, published: boolean): Observable<FaqCategory> {
    return timer(this.latency).pipe(
      map(() => {
        const current = this.categories().find((item) => item.id === id);
        if (!current) {
          throw new Error('missing-category');
        }
        const next: FaqCategory = { ...current, published };
        this.categories.update((list) => list.map((item) => (item.id === id ? next : item)));
        return structuredClone(next);
      }),
    );
  }
}
