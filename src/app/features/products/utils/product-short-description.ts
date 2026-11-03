/** Backend max length for product `short_description.{ar,en}` (UI `summary`). */
export const PRODUCT_SHORT_DESCRIPTION_MAX = 300;

export function isValidShortDescription(value: string): boolean {
  return value.length <= PRODUCT_SHORT_DESCRIPTION_MAX;
}
