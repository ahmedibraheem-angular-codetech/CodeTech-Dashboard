import type { LocalizedMedia } from '../../../core/media/localized-media';
import type { Article } from '../models/knowledge.model';

export type ArticleImageSlot = 'avatar' | 'thumbnail' | 'cover';

export const ARTICLE_IMAGE_SLOTS: readonly ArticleImageSlot[] = ['avatar', 'thumbnail', 'cover'];

export function articleSlotMedia(article: Article): Record<ArticleImageSlot, LocalizedMedia> {
  return { avatar: article.authorPhoto, thumbnail: article.thumbnail, cover: article.cover };
}
