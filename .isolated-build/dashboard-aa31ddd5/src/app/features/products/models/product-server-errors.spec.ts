import {
  clearServerErrorPaths,
  clearServerErrorPrefix,
  localeFromServerPath,
  productStepIndexForServerPath,
  serverErrorMessage,
  serverErrorPrefixMessage,
} from './product-server-errors';

describe('product server errors', () => {
  const errors = {
    slug: ['Invalid slug'],
    'short_description.ar': ['Too long'],
    'meta_keywords.ar.0': ['Max 50'],
    'meta_keywords.en.1': ['Max 50'],
    'sectors.0.image.ar': ['Required'],
    'workflow_steps.1.title.ar': ['Required'],
  } as const;

  it('reads exact and prefixed messages', () => {
    expect(serverErrorMessage(errors, 'slug')).toBe('Invalid slug');
    expect(serverErrorPrefixMessage(errors, 'meta_keywords.ar')).toBe('Max 50');
    expect(serverErrorPrefixMessage(errors, 'meta_keywords.en')).toBe('Max 50');
  });

  it('clears exact paths and prefixes', () => {
    expect(clearServerErrorPaths(errors, ['slug'])).not.toHaveProperty('slug');
    expect(clearServerErrorPrefix(errors, 'meta_keywords.ar')).toEqual({
      slug: ['Invalid slug'],
      'short_description.ar': ['Too long'],
      'meta_keywords.en.1': ['Max 50'],
      'sectors.0.image.ar': ['Required'],
      'workflow_steps.1.title.ar': ['Required'],
    });
  });

  it('maps paths to locale and wizard step', () => {
    expect(localeFromServerPath('short_description.ar')).toBe('ar');
    expect(localeFromServerPath('meta_keywords.en.0')).toBe('en');
    expect(localeFromServerPath('slug')).toBeNull();
    expect(productStepIndexForServerPath('slug')).toBe(7);
    expect(productStepIndexForServerPath('sectors.0.image.ar')).toBe(1);
    expect(productStepIndexForServerPath('workflow_steps.0.title.ar')).toBe(5);
    expect(productStepIndexForServerPath('stats.0.value.ar')).toBe(0);
  });
});
