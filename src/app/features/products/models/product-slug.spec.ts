import { isValidProductSlug } from './product-slug';

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
