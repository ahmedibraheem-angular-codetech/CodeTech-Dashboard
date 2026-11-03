/** Matches OpenAPI `ProductWrite.slug` when a value is provided. Empty → optional (`null`). */
export const PRODUCT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** True when empty/whitespace (optional) or the trimmed value matches `PRODUCT_SLUG_PATTERN`. */
export function isValidProductSlug(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 0 || PRODUCT_SLUG_PATTERN.test(trimmed);
}
