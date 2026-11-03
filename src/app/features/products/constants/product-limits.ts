/** Backend max length for product `short_description.{ar,en}` (UI `summary`). */
export const PRODUCT_SHORT_DESCRIPTION_MAX = 300;

/** Backend max length per `meta_keywords` entry after comma split. */
export const PRODUCT_META_KEYWORD_MAX = 50;

/** UI max length for SEO meta description. */
export const PRODUCT_SEO_DESCRIPTION_MAX = 160;

/** Matches OpenAPI `ProductWrite.slug` when a value is provided. */
export const PRODUCT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
