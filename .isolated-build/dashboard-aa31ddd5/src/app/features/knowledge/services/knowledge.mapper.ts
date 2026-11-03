import type { FileObject } from '../../../core/http/api.model';
import type {
  ArticleCategoryDto,
  ArticleCategoryWriteDto,
  ArticleDetailDto,
  ArticleListDto,
  ArticleStatsDto,
  ArticleWriteDto,
  KnowledgeKeywordsDto,
  KnowledgeLocaleDto,
} from '../models/knowledge.api';
import type {
  Article,
  ArticleCategory,
  ArticleCategoryDraft,
  ArticleDraft,
  ArticleMediaDraft,
  ArticleStats,
  ArticleStatus,
  KnowledgeMediaFile,
  KnowledgeMediaIntent,
} from '../models/knowledge.model';

function locale(value: KnowledgeLocaleDto | null | undefined, key: 'ar' | 'en'): string {
  const raw = value?.[key];
  return typeof raw === 'string' ? raw : '';
}

function keywords(value: KnowledgeKeywordsDto | null | undefined, key: 'ar' | 'en'): string {
  const list = value?.[key];
  return Array.isArray(list)
    ? list.filter((item) => typeof item === 'string' && item.trim()).join(', ')
    : '';
}

function splitKeywords(value: string): string[] {
  return value
    .split(/[,،]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mapKnowledgeMedia(value: FileObject | null | undefined): KnowledgeMediaFile | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  if (typeof value.uuid !== 'string' || typeof value.url !== 'string') {
    return null;
  }
  return {
    uuid: value.uuid,
    url: value.url,
    name: value.name || value.file_name || 'file',
    fileName: value.file_name || value.name || 'file',
    size: typeof value.size === 'number' ? value.size : 0,
  };
}

export function mapArticleStatus(value: string | null | undefined): ArticleStatus {
  if (value === 'published') {
    return 'published';
  }
  if (value === 'unpublished') {
    return 'unpublished';
  }
  return 'draft';
}

export function mapArticleCategory(dto: ArticleCategoryDto): ArticleCategory {
  return {
    id: String(dto.id),
    nameAr: locale(dto.name, 'ar'),
    nameEn: locale(dto.name, 'en'),
    published: !!dto.is_published,
    articleCount: typeof dto.articles_count === 'number' ? dto.articles_count : 0,
    order: typeof dto.sort_order === 'number' ? dto.sort_order : 0,
    createdAt: dto.created_at,
  };
}

function mapArticleBase(dto: ArticleListDto): Pick<
  Article,
  | 'id'
  | 'code'
  | 'titleAr'
  | 'titleEn'
  | 'excerptAr'
  | 'excerptEn'
  | 'categoryId'
  | 'categoryNameAr'
  | 'categoryNameEn'
  | 'status'
  | 'featured'
  | 'readingMinutes'
  | 'thumbnail'
  | 'thumbnailUrl'
  | 'publishedAt'
  | 'createdAt'
  | 'updatedAt'
> {
  const thumbnail = mapKnowledgeMedia(dto.thumbnail);
  return {
    id: String(dto.id),
    code: dto.code || String(dto.id).padStart(6, '0'),
    titleAr: locale(dto.title, 'ar'),
    titleEn: locale(dto.title, 'en'),
    excerptAr: locale(dto.excerpt, 'ar'),
    excerptEn: locale(dto.excerpt, 'en'),
    categoryId: String(dto.category?.id ?? ''),
    categoryNameAr: locale(dto.category?.name, 'ar'),
    categoryNameEn: locale(dto.category?.name, 'en'),
    status: mapArticleStatus(dto.status),
    featured: !!dto.is_featured,
    readingMinutes: typeof dto.reading_time_minutes === 'number' ? dto.reading_time_minutes : 1,
    thumbnail,
    thumbnailUrl: thumbnail?.url ?? '',
    publishedAt: dto.published_at ?? '',
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function mapArticleListItem(dto: ArticleListDto): Article {
  return {
    ...mapArticleBase(dto),
    contentAr: '',
    contentEn: '',
    authorNameAr: '',
    authorNameEn: '',
    authorPhoto: null,
    authorAvatarUrl: '',
    cover: null,
    coverUrl: '',
    coverTitleAr: '',
    coverTitleEn: '',
    coverAltAr: '',
    coverAltEn: '',
    thumbnailTitleAr: '',
    thumbnailTitleEn: '',
    thumbnailAltAr: '',
    thumbnailAltEn: '',
    slug: '',
    seoTitleAr: '',
    seoTitleEn: '',
    seoKeywordsAr: '',
    seoKeywordsEn: '',
    seoDescriptionAr: '',
    seoDescriptionEn: '',
  };
}

export function mapArticleDetail(dto: ArticleDetailDto): Article {
  const cover = mapKnowledgeMedia(dto.cover);
  const authorPhoto = mapKnowledgeMedia(dto.author_photo);
  return {
    ...mapArticleBase(dto),
    contentAr: locale(dto.content, 'ar'),
    contentEn: locale(dto.content, 'en'),
    authorNameAr: locale(dto.author_name, 'ar'),
    authorNameEn: locale(dto.author_name, 'en'),
    authorPhoto,
    authorAvatarUrl: authorPhoto?.url ?? '',
    cover,
    coverUrl: cover?.url ?? '',
    coverTitleAr: locale(dto.cover_title, 'ar'),
    coverTitleEn: locale(dto.cover_title, 'en'),
    coverAltAr: locale(dto.cover_alt, 'ar'),
    coverAltEn: locale(dto.cover_alt, 'en'),
    thumbnailTitleAr: locale(dto.thumbnail_title, 'ar'),
    thumbnailTitleEn: locale(dto.thumbnail_title, 'en'),
    thumbnailAltAr: locale(dto.thumbnail_alt, 'ar'),
    thumbnailAltEn: locale(dto.thumbnail_alt, 'en'),
    slug: typeof dto.slug === 'string' ? dto.slug : '',
    seoTitleAr: locale(dto.meta_title, 'ar'),
    seoTitleEn: locale(dto.meta_title, 'en'),
    seoKeywordsAr: keywords(dto.meta_keywords, 'ar'),
    seoKeywordsEn: keywords(dto.meta_keywords, 'en'),
    seoDescriptionAr: locale(dto.meta_description, 'ar'),
    seoDescriptionEn: locale(dto.meta_description, 'en'),
  };
}

export function mapArticleStats(dto: ArticleStatsDto): ArticleStats {
  return {
    total: dto.total?.value ?? 0,
    published: dto.published?.value ?? 0,
    featured: dto.featured?.value ?? 0,
    unpublished: dto.unpublished?.value ?? 0,
    totalChangePct: dto.total?.change_pct ?? null,
    publishedChangePct: dto.published?.change_pct ?? null,
    featuredChangePct: dto.featured?.change_pct ?? null,
    unpublishedChangePct: dto.unpublished?.change_pct ?? null,
  };
}

export function toArticleCategoryWrite(draft: ArticleCategoryDraft): ArticleCategoryWriteDto {
  return {
    name: {
      ar: draft.nameAr.trim(),
      en: draft.nameEn.trim(),
    },
    is_published: draft.published,
  };
}

function applyMediaIntent(
  body: ArticleWriteDto,
  key: 'cover' | 'thumbnail' | 'author_photo',
  intent: KnowledgeMediaIntent,
  uuid: string | null | undefined,
): void {
  if (intent.kind === 'omit') {
    return;
  }
  if (intent.kind === 'clear') {
    body[key] = null;
    return;
  }
  if (typeof uuid === 'string' && uuid) {
    body[key] = uuid;
  }
}

export function toArticleWrite(
  draft: ArticleDraft,
  media: ArticleMediaDraft,
  resolved: { cover?: string | null; thumbnail?: string | null; authorPhoto?: string | null },
): ArticleWriteDto {
  const body: ArticleWriteDto = {
    status: draft.status,
    article_category_id: Number(draft.categoryId),
    title: {
      ar: draft.titleAr.trim(),
      en: draft.titleEn.trim(),
    },
    excerpt: {
      ar: draft.excerptAr.trim(),
      en: draft.excerptEn.trim(),
    },
    content: {
      ar: draft.contentAr,
      en: draft.contentEn,
    },
    reading_time_minutes: draft.readingMinutes,
    is_featured: draft.featured,
    author_name: {
      ar: draft.authorNameAr.trim(),
      en: draft.authorNameEn.trim(),
    },
    thumbnail_title: {
      ar: draft.thumbnailTitleAr.trim(),
      en: draft.thumbnailTitleEn.trim(),
    },
    thumbnail_alt: {
      ar: draft.thumbnailAltAr.trim(),
      en: draft.thumbnailAltEn.trim(),
    },
    cover_title: {
      ar: draft.coverTitleAr.trim(),
      en: draft.coverTitleEn.trim(),
    },
    cover_alt: {
      ar: draft.coverAltAr.trim(),
      en: draft.coverAltEn.trim(),
    },
    slug: draft.slug.trim() || null,
    meta_title: {
      ar: draft.seoTitleAr.trim(),
      en: draft.seoTitleEn.trim(),
    },
    meta_description: {
      ar: draft.seoDescriptionAr.trim(),
      en: draft.seoDescriptionEn.trim(),
    },
    meta_keywords: {
      ar: splitKeywords(draft.seoKeywordsAr),
      en: splitKeywords(draft.seoKeywordsEn),
    },
    published_at: draft.publishedAt.trim() || null,
  };
  applyMediaIntent(body, 'cover', media.cover, resolved.cover);
  applyMediaIntent(body, 'thumbnail', media.thumbnail, resolved.thumbnail);
  applyMediaIntent(body, 'author_photo', media.authorPhoto, resolved.authorPhoto);
  return body;
}
