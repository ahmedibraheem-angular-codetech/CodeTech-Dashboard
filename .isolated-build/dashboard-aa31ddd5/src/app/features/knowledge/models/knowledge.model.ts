export type ArticleStatus = 'published' | 'draft' | 'unpublished';

export const ARTICLE_STATUSES: readonly ArticleStatus[] = ['published', 'draft', 'unpublished'];

export interface KnowledgeMediaFile {
  uuid: string;
  url: string;
  name: string;
  fileName: string;
  size: number;
}

export interface Article {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  categoryId: string;
  categoryNameAr: string;
  categoryNameEn: string;
  readingMinutes: number;
  status: ArticleStatus;
  featured: boolean;
  publishedAt: string;
  authorNameAr: string;
  authorNameEn: string;
  authorPhoto: KnowledgeMediaFile | null;
  authorAvatarUrl: string;
  thumbnail: KnowledgeMediaFile | null;
  thumbnailUrl: string;
  thumbnailTitleAr: string;
  thumbnailTitleEn: string;
  thumbnailAltAr: string;
  thumbnailAltEn: string;
  cover: KnowledgeMediaFile | null;
  coverUrl: string;
  coverTitleAr: string;
  coverTitleEn: string;
  coverAltAr: string;
  coverAltEn: string;
  contentAr: string;
  contentEn: string;
  slug: string;
  seoTitleAr: string;
  seoTitleEn: string;
  seoDescriptionAr: string;
  seoDescriptionEn: string;
  seoKeywordsAr: string;
  seoKeywordsEn: string;
  createdAt: string;
  updatedAt: string;
}

export type ArticleDraft = Omit<
  Article,
  | 'id'
  | 'code'
  | 'categoryNameAr'
  | 'categoryNameEn'
  | 'authorPhoto'
  | 'thumbnail'
  | 'cover'
  | 'createdAt'
  | 'updatedAt'
>;

export interface ArticleCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  order: number;
  published: boolean;
  articleCount: number;
  createdAt: string;
}

export type ArticleCategoryDraft = Pick<ArticleCategory, 'nameAr' | 'nameEn' | 'published'>;

/**
 * Media coat-check intents for article writes:
 * - `omit` → keep existing media (field not sent)
 * - `clear` → send `null` (remove)
 * - `replace` → upload File then send UUID
 */
export type KnowledgeMediaIntent =
  | { kind: 'omit' }
  | { kind: 'clear' }
  | { kind: 'replace'; file: File };

export interface ArticleMediaDraft {
  cover: KnowledgeMediaIntent;
  thumbnail: KnowledgeMediaIntent;
  authorPhoto: KnowledgeMediaIntent;
}

export interface ArticleStats {
  total: number;
  published: number;
  featured: number;
  unpublished: number;
  totalChangePct: number | null;
  publishedChangePct: number | null;
  featuredChangePct: number | null;
  unpublishedChangePct: number | null;
}

export interface ArticleListQuery {
  page?: number;
  perPage?: number;
  search?: string;
  status?: ArticleStatus | 'all';
  categoryId?: string | 'all';
  featured?: boolean | null;
  from?: string | null;
  to?: string | null;
}

export function blankArticle(): ArticleDraft {
  return {
    titleAr: '',
    titleEn: '',
    excerptAr: '',
    excerptEn: '',
    categoryId: '',
    readingMinutes: 5,
    status: 'draft',
    featured: false,
    publishedAt: '',
    authorNameAr: '',
    authorNameEn: '',
    authorAvatarUrl: '',
    thumbnailUrl: '',
    thumbnailTitleAr: '',
    thumbnailTitleEn: '',
    thumbnailAltAr: '',
    thumbnailAltEn: '',
    coverUrl: '',
    coverTitleAr: '',
    coverTitleEn: '',
    coverAltAr: '',
    coverAltEn: '',
    contentAr: '',
    contentEn: '',
    slug: '',
    seoTitleAr: '',
    seoTitleEn: '',
    seoDescriptionAr: '',
    seoDescriptionEn: '',
    seoKeywordsAr: '',
    seoKeywordsEn: '',
  };
}

export class CategoryInUseError extends Error {
  override readonly name = 'CategoryInUseError';

  constructor(id?: string) {
    super(id ? `Category still has articles: ${id}` : 'Category still has articles');
  }
}
