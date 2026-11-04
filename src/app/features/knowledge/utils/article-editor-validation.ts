export type ArticleValidationStrictness = 'strict' | 'lenient';

export interface ArticleFormValidationValue {
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  categoryId: string;
}

export interface ArticleValidationResult {
  missing: ReadonlySet<string>;
  /** Opposite locale when the active suffix has no issues but the other does. */
  switchTo?: 'ar' | 'en';
}

function hasVisibleHtml(value: string): boolean {
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim().length > 0;
}

/**
 * Collect missing field keys for publish (strict) or draft (lenient) saves.
 * Side effects (toast / flagged signal) stay in the component.
 */
export function collectArticleValidationIssues(
  value: ArticleFormValidationValue,
  strictness: ArticleValidationStrictness,
  activeSuffix: 'Ar' | 'En',
  hasVisibleHtmlFn: (html: string) => boolean = hasVisibleHtml,
): ArticleValidationResult {
  const missing = new Set<string>();

  if (strictness === 'strict') {
    for (const suffix of ['Ar', 'En'] as const) {
      if (!value[`title${suffix}`].trim()) {
        missing.add(`title${suffix}`);
      }
      if (!hasVisibleHtmlFn(value[`content${suffix}`])) {
        missing.add(`content${suffix}`);
      }
    }
    if (!value.categoryId) {
      missing.add('categoryId');
    }
  } else if (!value.titleAr.trim() && !value.titleEn.trim()) {
    missing.add(activeSuffix === 'Ar' ? 'titleAr' : 'titleEn');
  }

  if (missing.size === 0) {
    return { missing };
  }

  const hereHasIssue = [...missing].some(
    (name) => name.endsWith(activeSuffix) || name === 'categoryId',
  );
  return {
    missing,
    switchTo: hereHasIssue ? undefined : activeSuffix === 'Ar' ? 'en' : 'ar',
  };
}
