import { describe, expect, it } from 'vitest';

import type { FileObject } from '../../../core/http/api.model';
import type { SeoPageDto } from '../models/seo.api';
import {
  draftFingerprint,
  joinKeywords,
  mapSeoPage,
  parseKeywords,
  toApiPageKey,
  toSeoWrite,
  toTabId,
} from './seo.mapper';

const file = (overrides: Partial<FileObject> = {}): FileObject => ({
  uuid: 'thumb-uuid',
  name: 'share',
  file_name: 'share.png',
  mime_type: 'image/png',
  size: 10,
  url: 'https://cdn.test/share.png',
  download_url: 'https://cdn.test/download',
  created_at: '2026-11-01T10:00:00.000000Z',
  ...overrides,
});

const dto = (overrides: Partial<SeoPageDto> = {}): SeoPageDto => ({
  page: 'knowledge_center',
  meta_title: { ar: 'معرفة', en: 'Knowledge' },
  slug: 'knowledge-center',
  meta_keywords: { ar: ['تقنية'], en: ['tech', 'software'] },
  meta_description: { ar: 'وصف', en: 'Desc' },
  thumbnail: file(),
  thumbnail_title: { ar: 'عنوان', en: 'Title' },
  thumbnail_alt: { ar: 'بديل', en: 'Alt' },
  updated_by: { id: 1, name: 'Admin' },
  updated_at: '2026-11-01T10:00:00.000000Z',
  ...overrides,
});

describe('seo.mapper', () => {
  it('maps every frontend tab id to the backend page key', () => {
    expect(toApiPageKey('seo')).toBe('global');
    expect(toApiPageKey('home')).toBe('home');
    expect(toApiPageKey('about')).toBe('about');
    expect(toApiPageKey('products')).toBe('products');
    expect(toApiPageKey('projects')).toBe('projects');
    expect(toApiPageKey('services')).toBe('services');
    expect(toApiPageKey('knowledge')).toBe('knowledge_center');
  });

  it('maps every backend page key back to a tab id', () => {
    expect(toTabId('global')).toBe('seo');
    expect(toTabId('home')).toBe('home');
    expect(toTabId('about')).toBe('about');
    expect(toTabId('products')).toBe('products');
    expect(toTabId('projects')).toBe('projects');
    expect(toTabId('services')).toBe('services');
    expect(toTabId('knowledge_center')).toBe('knowledge');
    expect(toTabId('unknown')).toBeNull();
  });

  it('maps bilingual fields, a single shared slug, and thumbnail uuid/url', () => {
    const { tabId, draft } = mapSeoPage(dto());
    expect(tabId).toBe('knowledge');
    expect(draft.ar.metaTitle).toBe('معرفة');
    expect(draft.en.metaTitle).toBe('Knowledge');
    expect(draft.ar.slug).toBe('knowledge-center');
    expect(draft.en.slug).toBe('knowledge-center');
    expect(draft.ar.keywords).toBe('تقنية');
    expect(draft.en.keywords).toBe('tech, software');
    expect(draft.ar.description).toBe('وصف');
    expect(draft.en.thumbTitle).toBe('Title');
    expect(draft.thumbUuid).toBe('thumb-uuid');
    expect(draft.ar.thumbUrl).toBe('https://cdn.test/share.png');
    expect(draft.en.thumbUrl).toBe('https://cdn.test/share.png');
    expect(draft.thumbFile).toBeNull();
  });

  it('maps null locales, null slug, and null thumbnail safely', () => {
    const { draft } = mapSeoPage(
      dto({
        page: 'global',
        meta_title: { ar: 'عام', en: null },
        slug: null,
        meta_keywords: null,
        meta_description: { ar: null, en: 'Only EN' },
        thumbnail: null,
        thumbnail_title: null,
        thumbnail_alt: null,
      }),
    );
    expect(draft.ar.metaTitle).toBe('عام');
    expect(draft.en.metaTitle).toBe('');
    expect(draft.ar.slug).toBe('');
    expect(draft.en.slug).toBe('');
    expect(draft.ar.keywords).toBe('');
    expect(draft.en.description).toBe('Only EN');
    expect(draft.thumbUuid).toBeNull();
    expect(draft.ar.thumbUrl).toBe('');
  });

  it('rejects a thumbnail that only has a URL (never treat URL as UUID)', () => {
    const { draft } = mapSeoPage(
      dto({
        thumbnail: { url: 'https://cdn.test/x.png' } as FileObject,
      }),
    );
    expect(draft.thumbUuid).toBeNull();
    expect(draft.ar.thumbUrl).toBe('');
  });

  it('writes both languages, a single slug, keyword lists, and omits thumbnail when unchanged', () => {
    const { draft } = mapSeoPage(dto({ page: 'home' }));
    const body = toSeoWrite(draft, undefined);
    expect(body).toEqual({
      meta_title: { ar: 'معرفة', en: 'Knowledge' },
      slug: 'knowledge-center',
      meta_keywords: { ar: ['تقنية'], en: ['tech', 'software'] },
      meta_description: { ar: 'وصف', en: 'Desc' },
      thumbnail_title: { ar: 'عنوان', en: 'Title' },
      thumbnail_alt: { ar: 'بديل', en: 'Alt' },
    });
    expect(body).not.toHaveProperty('thumbnail');
  });

  it('sends null slug when empty and includes thumbnail UUID or null when resolved', () => {
    const { draft } = mapSeoPage(dto());
    draft.ar.slug = '  ';
    draft.en.slug = '';
    expect(toSeoWrite(draft, 'new-thumb').thumbnail).toBe('new-thumb');
    expect(toSeoWrite(draft, 'new-thumb').slug).toBeNull();
    expect(toSeoWrite(draft, null).thumbnail).toBeNull();
  });

  it('parses and joins keywords without inventing duplicates', () => {
    expect(parseKeywords(' tech, software, tech , ')).toEqual(['tech', 'software']);
    expect(joinKeywords(['a', 'b'])).toBe('a, b');
    expect(joinKeywords(null)).toBe('');
  });

  it('fingerprints drafts so a pending File marks dirty without using the preview URL as id', () => {
    const { draft } = mapSeoPage(dto());
    const before = draftFingerprint(draft);
    draft.thumbFile = new File(['x'], 'next.png', { type: 'image/png' });
    draft.ar.thumbUrl = 'blob:mock';
    draft.en.thumbUrl = 'blob:mock';
    expect(draftFingerprint(draft)).not.toBe(before);
  });
});
