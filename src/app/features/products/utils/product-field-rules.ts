import {
  PRODUCT_META_KEYWORD_MAX,
  PRODUCT_SHORT_DESCRIPTION_MAX,
  PRODUCT_SLUG_PATTERN,
} from '../constants/product-limits';

/** True when empty/whitespace (optional) or the trimmed value matches `PRODUCT_SLUG_PATTERN`. */
export function isValidProductSlug(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 0 || PRODUCT_SLUG_PATTERN.test(trimmed);
}

export function isValidShortDescription(value: string): boolean {
  return value.length <= PRODUCT_SHORT_DESCRIPTION_MAX;
}

/** Same split rules as `toProductWrite` (`/[,،]/`, trim, drop empties). */
export function splitProductKeywords(value: string): string[] {
  return value
    .split(/[,،]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function longestProductKeywordLength(value: string): number {
  return splitProductKeywords(value).reduce((max, keyword) => Math.max(max, keyword.length), 0);
}

export function isValidMetaKeywords(value: string): boolean {
  return splitProductKeywords(value).every((keyword) => keyword.length <= PRODUCT_META_KEYWORD_MAX);
}
