import type { AppLanguage } from '../../../core/i18n/language';
import { formatIsoDate } from '../../../shared/utils/date';
import type { Article, ArticleCategory } from '../models/knowledge.model';

/** Picks the Arabic or English side of a bilingual field, falling back to the other one. */
export function pick(ar: string, en: string, locale: AppLanguage): string {
  const first = locale === 'ar' ? ar : en;
  return first || (locale === 'ar' ? en : ar);
}

export function articleTitle(article: Article, locale: AppLanguage): string {
  return pick(article.titleAr, article.titleEn, locale);
}

export function articleExcerpt(article: Article, locale: AppLanguage): string {
  return pick(article.excerptAr, article.excerptEn, locale);
}

export function categoryName(
  category: ArticleCategory | null | undefined,
  locale: AppLanguage,
): string {
  return category ? pick(category.nameAr, category.nameEn, locale) : '';
}

/** `2026-10-09T14:30` → localized date. Empty when the article has no publish date. */
export function formatStampDate(stamp: string, locale: AppLanguage): string {
  return stamp ? formatIsoDate(stamp.slice(0, 10), locale) : '';
}

/** `2026-10-09T14:30` → `2:30 PM` / `2:30 م`. */
export function formatStampTime(stamp: string, locale: AppLanguage): string {
  const time = stamp.slice(11, 16);
  if (!time) {
    return '';
  }
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const suffixEn = hours >= 12 ? 'PM' : 'AM';
  const suffixAr = hours >= 12 ? 'م' : 'ص';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const clock = `${hour12}:${`${minutes}`.padStart(2, '0')}`;
  return locale === 'ar' ? `${clock} ${suffixAr}` : `${clock} ${suffixEn}`;
}

/** Local `yyyy-mm-ddThh:mm` for "now". */
export function nowStamp(clock: () => Date = () => new Date()): string {
  const value = clock();
  const pad = (part: number): string => `${part}`.padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}
