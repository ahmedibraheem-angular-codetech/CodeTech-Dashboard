/** Backend max length per `meta_keywords` entry after comma split. */
export const PRODUCT_META_KEYWORD_MAX = 50;

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
