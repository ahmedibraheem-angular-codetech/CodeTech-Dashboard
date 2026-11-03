import {
  PRODUCT_META_KEYWORD_MAX,
  PRODUCT_SHORT_DESCRIPTION_MAX,
} from '../constants/product-limits';
import {
  isValidMetaKeywords,
  isValidProductSlug,
  isValidShortDescription,
  longestProductKeywordLength,
  splitProductKeywords,
} from './product-field-rules';

describe('product field rules', () => {
  describe('isValidProductSlug', () => {
    it('treats empty and whitespace-only values as optional', () => {
      expect(isValidProductSlug('')).toBe(true);
      expect(isValidProductSlug('   ')).toBe(true);
    });

    it('accepts lowercase alphanumeric segments separated by single hyphens', () => {
      expect(isValidProductSlug('itsm')).toBe(true);
      expect(isValidProductSlug('my-product')).toBe(true);
      expect(isValidProductSlug('a1-b2-c3')).toBe(true);
      expect(isValidProductSlug('  my-product  ')).toBe(true);
    });

    it('rejects uppercase, spaces, non-latin characters, and malformed hyphens', () => {
      expect(isValidProductSlug('ITSM')).toBe(false);
      expect(isValidProductSlug('My-Product')).toBe(false);
      expect(isValidProductSlug('my product')).toBe(false);
      expect(isValidProductSlug('منتج')).toBe(false);
      expect(isValidProductSlug('-itsm')).toBe(false);
      expect(isValidProductSlug('itsm-')).toBe(false);
      expect(isValidProductSlug('my--product')).toBe(false);
    });
  });

  describe('isValidShortDescription', () => {
    it('accepts empty and values up to 300 characters', () => {
      expect(isValidShortDescription('')).toBe(true);
      expect(isValidShortDescription('a'.repeat(PRODUCT_SHORT_DESCRIPTION_MAX))).toBe(true);
    });

    it('rejects values longer than 300 characters', () => {
      expect(isValidShortDescription('a'.repeat(PRODUCT_SHORT_DESCRIPTION_MAX + 1))).toBe(false);
    });
  });

  describe('meta keywords', () => {
    it('splits on Latin and Arabic commas and ignores empty parts', () => {
      expect(splitProductKeywords('a, b، c,,  ')).toEqual(['a', 'b', 'c']);
      expect(splitProductKeywords('')).toEqual([]);
    });

    it('accepts keywords up to 50 characters and rejects longer ones', () => {
      const ok = 'a'.repeat(PRODUCT_META_KEYWORD_MAX);
      const tooLong = 'a'.repeat(PRODUCT_META_KEYWORD_MAX + 1);
      expect(isValidMetaKeywords(`${ok}, short`)).toBe(true);
      expect(isValidMetaKeywords(`short, ${tooLong}`)).toBe(false);
      expect(longestProductKeywordLength(`ab, ${tooLong}`)).toBe(PRODUCT_META_KEYWORD_MAX + 1);
    });
  });
});
