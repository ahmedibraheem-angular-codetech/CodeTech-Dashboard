import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { type Observable, map, of, switchMap, tap } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import type { ApiEnvelope } from '../../../core/http/api.model';
import { MediaService } from '../../../core/media/media.service';
import type { SeoPageDto } from '../models/seo.api';
import {
  type SeoContent,
  type SeoLocale,
  type SeoPageDraft,
  type SeoTabId,
  emptyDraft,
  isSeoTabId,
} from '../models/seo.model';
import {
  draftFingerprint,
  emptyCatalog,
  mapSeoPage,
  toApiPageKey,
  toSeoWrite,
} from './seo.mapper';

const PATH = 'admin/seo';

/**
 * Site SEO pages. Overview loads once; each tab saves to its own API page key
 * (`seo` → `global`, `knowledge` → `knowledge_center`, others match 1:1).
 * Thumbnail uses coat-check: omit to keep, UUID to replace (UI has no clear).
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly http = inject(HttpClient);
  private readonly media = inject(MediaService);
  private readonly base = inject(API_BASE_URL);

  private readonly pages = signal<Record<SeoTabId, SeoPageDraft>>(emptyCatalog());
  private readonly baseline = signal<Record<SeoTabId, SeoPageDraft>>(emptyCatalog());

  readonly revision = signal(0);

  loadAll(): Observable<Record<SeoTabId, SeoPageDraft>> {
    return this.http.get<ApiEnvelope<SeoPageDto[]>>(apiUrl(this.base, PATH)).pipe(
      map((envelope) => this.requireList(envelope)),
      map((rows) => this.catalogFromList(rows)),
      tap((catalog) => this.replaceCatalog(catalog)),
    );
  }

  loadPage(tabId: string): Observable<SeoPageDraft> {
    const key = toApiPageKey(tabId);
    return this.http
      .get<ApiEnvelope<SeoPageDto>>(apiUrl(this.base, `${PATH}/${key}`))
      .pipe(
        map((envelope) => this.requireOne(envelope, key)),
        map((dto) => mapSeoPage(dto).draft),
        tap((draft) => this.replacePage(tabId as SeoTabId, draft)),
      );
  }

  content(pageId: string, locale: SeoLocale): SeoContent {
    return this.draftOf(pageId)[locale];
  }

  dirty(pageId: string): boolean {
    if (!isSeoTabId(pageId)) {
      return false;
    }
    return draftFingerprint(this.pages()[pageId]) !== draftFingerprint(this.baseline()[pageId]);
  }

  patch(pageId: string, locale: SeoLocale, partial: Partial<SeoContent>): void {
    if (!isSeoTabId(pageId)) {
      return;
    }
    this.pages.update((all) => {
      const current = all[pageId];
      const nextLocale: SeoContent = { ...current[locale], ...partial };
      let ar = locale === 'ar' ? nextLocale : current.ar;
      let en = locale === 'en' ? nextLocale : current.en;

      // Single slug in the API — keep both form languages in sync.
      if (partial.slug !== undefined) {
        ar = { ...ar, slug: partial.slug };
        en = { ...en, slug: partial.slug };
      }

      return { ...all, [pageId]: { ...current, ar, en } };
    });
  }

  /**
   * Shared thumbnail for both languages. Stores the File for coat-check upload;
   * preview URL is for display only and is never sent as a UUID.
   */
  setThumbnail(pageId: string, file: File, previewUrl: string): void {
    if (!isSeoTabId(pageId)) {
      return;
    }
    this.pages.update((all) => {
      const current = all[pageId];
      this.revokeBlob(current.ar.thumbUrl);
      const thumb = { thumbName: file.name, thumbUrl: previewUrl };
      return {
        ...all,
        [pageId]: {
          ...current,
          thumbFile: file,
          ar: { ...current.ar, ...thumb },
          en: { ...current.en, ...thumb },
        },
      };
    });
  }

  save(pageId: string): Observable<SeoPageDraft> {
    if (!isSeoTabId(pageId)) {
      throw new Error(`Unknown SEO tab id: ${pageId}`);
    }
    const draft = this.pages()[pageId];
    const key = toApiPageKey(pageId);
    return this.resolveThumbnail(draft).pipe(
      switchMap((thumbnail) =>
        this.http.put<ApiEnvelope<SeoPageDto>>(
          apiUrl(this.base, `${PATH}/${key}`),
          toSeoWrite(draft, thumbnail),
        ),
      ),
      map((envelope) => this.requireOne(envelope, key)),
      map((dto) => mapSeoPage(dto).draft),
      tap((saved) => {
        this.releaseDraftBlobs(draft, saved);
        this.replacePage(pageId, saved);
      }),
    );
  }

  revert(pageId: string): void {
    if (!isSeoTabId(pageId)) {
      return;
    }
    const current = this.pages()[pageId];
    const restored = structuredClone(this.baseline()[pageId]) as SeoPageDraft;
    // File cannot survive structuredClone meaningfully for identity — baseline never holds a pending File.
    restored.thumbFile = null;
    this.releaseDraftBlobs(current, restored);
    this.pages.update((all) => ({ ...all, [pageId]: restored }));
    this.revision.update((value) => value + 1);
  }

  private resolveThumbnail(
    draft: SeoPageDraft,
  ): Observable<string | null | undefined> {
    if (draft.thumbFile) {
      return this.media.upload('image', draft.thumbFile).pipe(map((file) => file.uuid));
    }

    return of(undefined);
  }

  private catalogFromList(rows: SeoPageDto[]): Record<SeoTabId, SeoPageDraft> {
    const catalog = emptyCatalog();
    for (const row of rows) {
      try {
        const mapped = mapSeoPage(row);
        catalog[mapped.tabId] = mapped.draft;
      } catch {
        // Ignore unknown page keys from older APIs.
      }
    }
    return catalog;
  }

  private replaceCatalog(catalog: Record<SeoTabId, SeoPageDraft>): void {
    const previous = this.pages();
    for (const id of Object.keys(previous) as SeoTabId[]) {
      this.releaseDraftBlobs(previous[id], catalog[id]);
    }
    const cloned = structuredClone(catalog) as Record<SeoTabId, SeoPageDraft>;
    for (const id of Object.keys(cloned) as SeoTabId[]) {
      cloned[id].thumbFile = null;
    }
    this.pages.set(catalog);
    this.baseline.set(cloned);
    this.revision.update((value) => value + 1);
  }

  private replacePage(tabId: SeoTabId, draft: SeoPageDraft): void {
    const baselineDraft = structuredClone(draft) as SeoPageDraft;
    baselineDraft.thumbFile = null;
    this.pages.update((all) => ({ ...all, [tabId]: draft }));
    this.baseline.update((all) => ({ ...all, [tabId]: baselineDraft }));
    this.revision.update((value) => value + 1);
  }

  private draftOf(pageId: string): SeoPageDraft {
    if (!isSeoTabId(pageId)) {
      return emptyDraft();
    }
    return this.pages()[pageId];
  }

  private requireList(envelope: ApiEnvelope<SeoPageDto[]>): SeoPageDto[] {
    return Array.isArray(envelope?.data) ? envelope.data : [];
  }

  private requireOne(envelope: ApiEnvelope<SeoPageDto>, expected: string): SeoPageDto {
    const data = envelope?.data;
    if (!data || typeof data.page !== 'string') {
      throw new Error('Invalid SEO page response');
    }
    if (data.page !== expected) {
      throw new Error(`SEO page mismatch: expected ${expected}, got ${data.page}`);
    }
    return data;
  }

  private releaseDraftBlobs(dropped: SeoPageDraft, kept: SeoPageDraft): void {
    const keptUrls = new Set([kept.ar.thumbUrl, kept.en.thumbUrl]);
    for (const url of [dropped.ar.thumbUrl, dropped.en.thumbUrl]) {
      if (url.startsWith('blob:') && !keptUrls.has(url)) {
        this.revokeBlob(url);
      }
    }
  }

  private revokeBlob(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}
