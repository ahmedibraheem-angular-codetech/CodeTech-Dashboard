import type { Article, ArticleMediaDraft, KnowledgeMediaIntent } from '../models/knowledge.model';

export type ArticleImageSlot = 'avatar' | 'thumbnail' | 'cover';

export interface ArticleSlotImage {
  url: string;
  name: string;
  size: number;
  date: string;
  file?: File;
  cleared?: boolean;
}

export const EMPTY_ARTICLE_IMAGES: Record<ArticleImageSlot, ArticleSlotImage | null> = {
  avatar: null,
  thumbnail: null,
  cover: null,
};

export function slotImageFromUrl(url: string, date: string, size = 0): ArticleSlotImage | null {
  return url ? { url, name: url.split('/').pop() ?? url, size, date } : null;
}

export function existingArticleImageUrl(article: Article | null, slot: ArticleImageSlot): string {
  if (!article) {
    return '';
  }
  if (slot === 'avatar') {
    return article.authorAvatarUrl;
  }
  if (slot === 'thumbnail') {
    return article.thumbnailUrl;
  }
  return article.coverUrl;
}

export function mediaIntentFromSlot(
  image: ArticleSlotImage | null | undefined,
): KnowledgeMediaIntent {
  if (image?.file) {
    return { kind: 'replace', file: image.file };
  }
  if (image?.cleared) {
    return { kind: 'clear' };
  }
  return { kind: 'omit' };
}

export function mediaDraftFromImages(
  images: Record<ArticleImageSlot, ArticleSlotImage | null>,
): ArticleMediaDraft {
  return {
    cover: mediaIntentFromSlot(images.cover),
    thumbnail: mediaIntentFromSlot(images.thumbnail),
    authorPhoto: mediaIntentFromSlot(images.avatar),
  };
}

export function articleImagesFromArticle(
  article: Article,
): Record<ArticleImageSlot, ArticleSlotImage | null> {
  return {
    avatar: slotImageFromUrl(article.authorAvatarUrl, article.createdAt, article.authorPhoto?.size),
    thumbnail: slotImageFromUrl(article.thumbnailUrl, article.createdAt, article.thumbnail?.size),
    cover: slotImageFromUrl(article.coverUrl, article.createdAt, article.cover?.size),
  };
}
