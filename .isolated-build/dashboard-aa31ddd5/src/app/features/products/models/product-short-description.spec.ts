import {
  PRODUCT_SHORT_DESCRIPTION_MAX,
  isValidShortDescription,
} from './product-short-description';

describe('isValidShortDescription', () => {
  it('accepts empty and values up to 300 characters', () => {
    expect(isValidShortDescription('')).toBe(true);
    expect(isValidShortDescription('a'.repeat(PRODUCT_SHORT_DESCRIPTION_MAX))).toBe(true);
  });

  it('rejects values longer than 300 characters', () => {
    expect(isValidShortDescription('a'.repeat(PRODUCT_SHORT_DESCRIPTION_MAX + 1))).toBe(false);
  });
});
