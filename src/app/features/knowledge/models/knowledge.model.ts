export type ArticleStatus = 'published' | 'draft' | 'unpublished';

export const ARTICLE_STATUSES: readonly ArticleStatus[] = ['published', 'draft', 'unpublished'];

/** Full article record. The list reads a subset; the editor and detail pages read the rest. */
export interface Article {
  /** Numeric string. Doubles as the ID column and the route parameter. */
  id: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  categoryId: string;
  readingMinutes: number;
  status: ArticleStatus;
  featured: boolean;
  /** ISO local date-time: `yyyy-mm-ddThh:mm`. */
  publishedAt: string;
  authorNameAr: string;
  authorNameEn: string;
  authorAvatarUrl: string;
  thumbnailUrl: string;
  thumbnailTitleAr: string;
  thumbnailTitleEn: string;
  thumbnailAltAr: string;
  thumbnailAltEn: string;
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
  /** ISO date: `yyyy-mm-dd`. */
  createdAt: string;
}

export type ArticleDraft = Omit<Article, 'id' | 'createdAt'>;

export interface ArticleCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  /** Display order shown on the category card. */
  order: number;
  published: boolean;
  /** Derived by the service from the articles that reference this category. */
  articleCount: number;
  /** ISO date: `yyyy-mm-dd`. */
  createdAt: string;
}

export type ArticleCategoryDraft = Pick<ArticleCategory, 'nameAr' | 'nameEn' | 'published'>;

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
