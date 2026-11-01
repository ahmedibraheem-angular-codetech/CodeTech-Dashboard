import { Injectable, inject, signal } from '@angular/core';
import { type Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { toIsoDate } from '../../../shared/utils/date';
import type {
  Article,
  ArticleCategory,
  ArticleCategoryDraft,
  ArticleDraft,
  ArticleStatus,
} from '../models/knowledge.model';
import { ARTICLES_SEED, CATEGORIES_SEED } from './knowledge.mock';

export class CategoryInUseError extends Error {
  constructor(id: string) {
    super(`Category still has articles: ${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class KnowledgeService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly articles = signal<Article[]>(structuredClone(ARTICLES_SEED));
  private readonly categories = signal<Omit<ArticleCategory, 'articleCount'>[]>(
    structuredClone(CATEGORIES_SEED),
  );

  list(): Observable<Article[]> {
    return this.respond(() => this.articles());
  }

  get(id: string): Observable<Article | null> {
    return this.respond(() => this.articles().find((item) => item.id === id) ?? null);
  }

  create(draft: ArticleDraft): Observable<Article> {
    return this.respond(() => {
      const next: Article = { ...draft, id: this.nextId(), createdAt: toIsoDate(new Date()) };
      this.articles.update((list) => [next, ...list]);
      return next;
    });
  }

  update(article: Article): Observable<Article> {
    return this.respond(() => this.patch(article.id, article));
  }

  setStatus(id: string, status: ArticleStatus): Observable<Article> {
    return this.respond(() => this.patch(id, { status }));
  }

  setFeatured(id: string, featured: boolean): Observable<Article> {
    return this.respond(() => this.patch(id, { featured }));
  }

  remove(id: string): Observable<void> {
    return this.respond(() => {
      this.articles.update((list) => list.filter((item) => item.id !== id));
    });
  }

  listCategories(): Observable<ArticleCategory[]> {
    return this.respond(() => this.withCounts());
  }

  createCategory(draft: ArticleCategoryDraft): Observable<ArticleCategory> {
    return this.respond(() => {
      const list = this.categories();
      const next = {
        ...draft,
        id: this.nextCategoryId(),
        order: list.reduce((max, item) => Math.max(max, item.order), 0) + 1,
        createdAt: toIsoDate(new Date()),
      };
      this.categories.set([...list, next]);
      return this.countOf(next);
    });
  }

  updateCategory(id: string, draft: ArticleCategoryDraft): Observable<ArticleCategory> {
    return this.respond(() => {
      const current = this.categories().find((item) => item.id === id);
      if (!current) {
        throw new Error(`Category not found: ${id}`);
      }
      const next = { ...current, ...draft };
      this.categories.update((list) => list.map((item) => (item.id === id ? next : item)));
      return this.countOf(next);
    });
  }

  removeCategory(id: string): Observable<void> {
    return this.respond(() => {
      if (this.articles().some((item) => item.categoryId === id)) {
        throw new CategoryInUseError(id);
      }
      this.categories.update((list) => list.filter((item) => item.id !== id));
    });
  }

  private patch(id: string, changes: Partial<Article>): Article {
    const current = this.articles().find((item) => item.id === id);
    if (!current) {
      throw new Error(`Article not found: ${id}`);
    }
    const next: Article = { ...current, ...changes, id: current.id };
    this.articles.update((list) => list.map((item) => (item.id === id ? next : item)));
    return next;
  }

  private withCounts(): ArticleCategory[] {
    return this.categories().map((category) => this.countOf(category));
  }

  private countOf(category: Omit<ArticleCategory, 'articleCount'>): ArticleCategory {
    return {
      ...category,
      articleCount: this.articles().filter((item) => item.categoryId === category.id).length,
    };
  }

  private nextId(): string {
    const taken = new Set(this.articles().map((item) => item.id));
    let id: string;
    do {
      id = `${Math.floor(100000 + Math.random() * 900000)}`;
    } while (taken.has(id));
    return id;
  }

  private nextCategoryId(): string {
    const taken = new Set(this.categories().map((item) => item.id));
    let id: string;
    do {
      id = `${Math.floor(100000 + Math.random() * 900000)}`;
    } while (taken.has(id));
    return id;
  }

  private respond<T>(read: () => T): Observable<T> {
    return timer(this.latency).pipe(map(() => structuredClone(read())));
  }
}
