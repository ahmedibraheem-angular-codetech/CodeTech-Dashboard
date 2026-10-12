import { Injectable, signal } from '@angular/core';

import { SEO_PAGES, SeoContent, SeoLocale, emptyContent } from '../models/seo.model';

type PageContent = Record<SeoLocale, SeoContent>;

/**
 * In-memory SEO drafts, one per page and language. Nothing is persisted: a later API can replace
 * `save` without the form knowing where the data lives.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly pages = signal<Record<string, PageContent>>(this.seed());
  private readonly baseline = signal<Record<string, PageContent>>(structuredClone(this.pages()));
  /** Bumped on revert so open forms reload the restored values. */
  readonly revision = signal(0);

  content(pageId: string, locale: SeoLocale): SeoContent {
    return this.pages()[pageId][locale];
  }

  dirty(pageId: string): boolean {
    return JSON.stringify(this.pages()[pageId]) !== JSON.stringify(this.baseline()[pageId]);
  }

  patch(pageId: string, locale: SeoLocale, partial: Partial<SeoContent>): void {
    this.pages.update((all) => ({
      ...all,
      [pageId]: {
        ...all[pageId],
        [locale]: { ...all[pageId][locale], ...partial },
      },
    }));
  }

  save(pageId: string): void {
    this.releaseReplaced(this.baseline()[pageId], this.pages()[pageId]);
    this.baseline.update((all) => ({ ...all, [pageId]: structuredClone(this.pages()[pageId]) }));
  }

  revert(pageId: string): void {
    this.releaseReplaced(this.pages()[pageId], this.baseline()[pageId]);
    this.pages.update((all) => ({ ...all, [pageId]: structuredClone(this.baseline()[pageId]) }));
    this.revision.update((value) => value + 1);
  }

  private seed(): Record<string, PageContent> {
    return Object.fromEntries(
      SEO_PAGES.map((page) => [page.id, { ar: emptyContent(), en: emptyContent() }]),
    );
  }

  /** Drops object URLs that the kept copy no longer references. */
  private releaseReplaced(dropped: PageContent, kept: PageContent): void {
    for (const locale of ['ar', 'en'] as const) {
      const url = dropped[locale].thumbUrl;
      if (url.startsWith('blob:') && url !== kept[locale].thumbUrl) {
        URL.revokeObjectURL(url);
      }
    }
  }
}
