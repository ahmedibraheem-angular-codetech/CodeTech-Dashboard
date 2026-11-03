import {
  PRODUCT_META_KEYWORD_MAX,
  isValidMetaKeywords,
  longestProductKeywordLength,
  splitProductKeywords,
} from './product-meta-keywords';

describe('product meta keywords validation', () => {
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
