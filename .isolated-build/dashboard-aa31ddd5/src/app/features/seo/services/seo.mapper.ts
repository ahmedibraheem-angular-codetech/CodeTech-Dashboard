import type { FileObject } from '../../../core/http/api.model';
import type { SeoApiPageKey, SeoLocaleDto, SeoPageDto, SeoPageWriteDto } from '../models/seo.api';
import {
  SEO_API_TO_TAB,
  SEO_TAB_TO_API,
  type SeoContent,
  type SeoPageDraft,
  type SeoTabId,
  emptyDraft,
} from '../models/seo.model';

export function toApiPageKey(tabId: string): SeoApiPageKey {
  if (!(tabId in SEO_TAB_TO_API)) {
    throw new Error(`Unknown SEO tab id: ${tabId}`);
  }
  return SEO_TAB_TO_API[tabId as SeoTabId];
}

export function toTabId(pageKey: string): SeoTabId | null {
  if (!(pageKey in SEO_API_TO_TAB)) {
    return null;
  }
  return SEO_API_TO_TAB[pageKey as SeoApiPageKey];
}

export function mapSeoPage(dto: SeoPageDto): { tabId: SeoTabId; draft: SeoPageDraft } {
  const tabId = toTabId(dto.page);
  if (!tabId) {
    throw new Error(`Unknown SEO page key: ${dto.page}`);
  }
  const slug = dto.slug ?? '';
  const thumb = mapThumb(dto.thumbnail);
  return {
    tabId,
    draft: {
      ar: mapLocaleContent(dto, 'ar', slug, thumb),
      en: mapLocaleContent(dto, 'en', slug, thumb),
      thumbUuid: thumb?.uuid ?? null,
      thumbFile: null,
    },
  };
}

export function toSeoWrite(
  draft: SeoPageDraft,
  thumbnail: string | null | undefined,
): SeoPageWriteDto {
  const body: SeoPageWriteDto = {
    meta_title: {
      ar: draft.ar.metaTitle.trim(),
      en: draft.en.metaTitle.trim(),
    },
    slug: toSlugWrite(draft.ar.slug || draft.en.slug),
    meta_keywords: {
      ar: parseKeywords(draft.ar.keywords),
      en: parseKeywords(draft.en.keywords),
    },
    meta_description: {
      ar: draft.ar.description.slice(0, 160),
      en: draft.en.description.slice(0, 160),
    },
    thumbnail_title: {
      ar: draft.ar.thumbTitle.trim(),
      en: draft.en.thumbTitle.trim(),
    },
    thumbnail_alt: {
      ar: draft.ar.thumbAlt.trim(),
      en: draft.en.thumbAlt.trim(),
    },
  };
  if (thumbnail !== undefined) {
    body.thumbnail = thumbnail;
  }
  return body;
}

export function draftFingerprint(draft: SeoPageDraft): string {
  return JSON.stringify({
    ar: contentFingerprint(draft.ar),
    en: contentFingerprint(draft.en),
    thumbUuid: draft.thumbUuid,
    hasFile: !!draft.thumbFile,
    fileName: draft.thumbFile?.name ?? null,
    fileSize: draft.thumbFile?.size ?? null,
  });
}

export function parseKeywords(value: string): string[] {
  if (!value.trim()) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of value.split(',')) {
    const keyword = part.trim();
    if (!keyword || seen.has(keyword)) {
      continue;
    }
    seen.add(keyword);
    out.push(keyword);
  }
  return out;
}

export function joinKeywords(values: string[] | null | undefined): string {
  if (!Array.isArray(values) || values.length === 0) {
    return '';
  }
  return values.filter((item) => typeof item === 'string' && item.trim()).join(', ');
}

function mapLocaleContent(
  dto: SeoPageDto,
  locale: 'ar' | 'en',
  slug: string,
  thumb: { uuid: string; url: string; name: string } | null,
): SeoContent {
  return {
    metaTitle: readLocale(dto.meta_title, locale),
    slug,
    keywords: joinKeywords(dto.meta_keywords?.[locale] ?? null),
    description: readLocale(dto.meta_description, locale),
    thumbTitle: readLocale(dto.thumbnail_title, locale),
    thumbAlt: readLocale(dto.thumbnail_alt, locale),
    thumbName: thumb?.name ?? '',
    thumbUrl: thumb?.url ?? '',
  };
}

function mapThumb(
  value: FileObject | null | undefined,
): { uuid: string; url: string; name: string } | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  if (typeof value.uuid !== 'string' || typeof value.url !== 'string') {
    return null;
  }
  return {
    uuid: value.uuid,
    url: value.url,
    name: value.file_name || value.name || 'image',
  };
}

function readLocale(dto: SeoLocaleDto | null | undefined, locale: 'ar' | 'en'): string {
  const value = dto?.[locale];
  return typeof value === 'string' ? value : '';
}

function toSlugWrite(value: string): string | null {
  const slug = value.trim();
  return slug ? slug : null;
}

function contentFingerprint(content: SeoContent): Omit<SeoContent, 'thumbUrl'> & {
  thumbUrlKind: 'blob' | 'remote' | 'empty';
} {
  return {
    metaTitle: content.metaTitle,
    slug: content.slug,
    keywords: content.keywords,
    description: content.description,
    thumbTitle: content.thumbTitle,
    thumbAlt: content.thumbAlt,
    thumbName: content.thumbName,
    thumbUrlKind: content.thumbUrl.startsWith('blob:')
      ? 'blob'
      : content.thumbUrl
        ? 'remote'
        : 'empty',
  };
}

export function emptyCatalog(): Record<SeoTabId, SeoPageDraft> {
  return {
    seo: emptyDraft(),
    home: emptyDraft(),
    about: emptyDraft(),
    products: emptyDraft(),
    projects: emptyDraft(),
    services: emptyDraft(),
    knowledge: emptyDraft(),
  };
}
