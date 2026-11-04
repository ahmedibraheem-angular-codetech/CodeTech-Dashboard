import {
  blankArticle,
  type Article,
  type ArticleDraft,
  type ArticleStatus,
} from '../models/knowledge.model';
import { nowStamp } from './knowledge-format';

/** Raw bilingual form values used by the article editor (excluding media URLs). */
export interface ArticleEditorFormValue {
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  categoryId: string;
  readingMinutes: number;
  publishedDate: string;
  authorNameAr: string;
  authorNameEn: string;
  slug: string;
  seoTitleAr: string;
  seoTitleEn: string;
  seoDescriptionAr: string;
  seoDescriptionEn: string;
  seoKeywordsAr: string;
  seoKeywordsEn: string;
  thumbnailTitleAr: string;
  thumbnailTitleEn: string;
  thumbnailAltAr: string;
  thumbnailAltEn: string;
  coverTitleAr: string;
  coverTitleEn: string;
  coverAltAr: string;
  coverAltEn: string;
  contentAr: string;
  contentEn: string;
}

export function articleFormValueFromArticle(article: Article): ArticleEditorFormValue {
  return {
    titleAr: article.titleAr,
    titleEn: article.titleEn,
    excerptAr: article.excerptAr,
    excerptEn: article.excerptEn,
    categoryId: article.categoryId,
    readingMinutes: article.readingMinutes,
    publishedDate: (article.publishedAt || '').slice(0, 10),
    authorNameAr: article.authorNameAr,
    authorNameEn: article.authorNameEn,
    slug: article.slug,
    seoTitleAr: article.seoTitleAr,
    seoTitleEn: article.seoTitleEn,
    seoDescriptionAr: article.seoDescriptionAr,
    seoDescriptionEn: article.seoDescriptionEn,
    seoKeywordsAr: article.seoKeywordsAr,
    seoKeywordsEn: article.seoKeywordsEn,
    thumbnailTitleAr: article.thumbnailTitleAr,
    thumbnailTitleEn: article.thumbnailTitleEn,
    thumbnailAltAr: article.thumbnailAltAr,
    thumbnailAltEn: article.thumbnailAltEn,
    coverTitleAr: article.coverTitleAr,
    coverTitleEn: article.coverTitleEn,
    coverAltAr: article.coverAltAr,
    coverAltEn: article.coverAltEn,
    contentAr: article.contentAr,
    contentEn: article.contentEn,
  };
}

export function fieldsFromArticleForm(
  raw: ArticleEditorFormValue,
  status: ArticleStatus,
  options: {
    previousPublishedAt?: string;
    featured?: boolean;
    clock?: () => Date;
  } = {},
): ArticleDraft {
  const now = nowStamp(options.clock);
  const previous = options.previousPublishedAt ?? '';
  const time = previous.slice(11, 16) || now.slice(11, 16);
  const { publishedDate, ...text } = raw;
  return {
    ...blankArticle(),
    titleAr: text.titleAr.trim(),
    titleEn: text.titleEn.trim(),
    excerptAr: text.excerptAr.trim(),
    excerptEn: text.excerptEn.trim(),
    categoryId: text.categoryId,
    readingMinutes: Math.max(1, Math.round(Number(text.readingMinutes) || 1)),
    status,
    featured: options.featured ?? false,
    publishedAt: `${publishedDate || now.slice(0, 10)}T${time}`,
    authorNameAr: text.authorNameAr.trim(),
    authorNameEn: text.authorNameEn.trim(),
    authorAvatarUrl: '',
    thumbnailUrl: '',
    thumbnailTitleAr: text.thumbnailTitleAr.trim(),
    thumbnailTitleEn: text.thumbnailTitleEn.trim(),
    thumbnailAltAr: text.thumbnailAltAr.trim(),
    thumbnailAltEn: text.thumbnailAltEn.trim(),
    coverUrl: '',
    coverTitleAr: text.coverTitleAr.trim(),
    coverTitleEn: text.coverTitleEn.trim(),
    coverAltAr: text.coverAltAr.trim(),
    coverAltEn: text.coverAltEn.trim(),
    contentAr: text.contentAr,
    contentEn: text.contentEn,
    slug: text.slug.trim(),
    seoTitleAr: text.seoTitleAr.trim(),
    seoTitleEn: text.seoTitleEn.trim(),
    seoDescriptionAr: text.seoDescriptionAr.trim(),
    seoDescriptionEn: text.seoDescriptionEn.trim(),
    seoKeywordsAr: text.seoKeywordsAr,
    seoKeywordsEn: text.seoKeywordsEn,
  };
}
