import { SEO_STEP_INDEX } from '../constants/product-steps';
import { blankProduct, type Product } from '../models/product.model';
import {
  evaluateProductPersist,
  invalidSummaryLocale,
  productSummaryLocalesValid,
  resolveServerErrorFocus,
} from './product-editor-persist';

function draft(patch: (product: Product) => void): Product {
  const product = blankProduct();
  patch(product);
  return product;
}

describe('product-editor-persist', () => {
  it('returns busy while saving or before the editor is ready', () => {
    expect(
      evaluateProductPersist(blankProduct(), false, { saving: true, status: 'ready' }),
    ).toEqual({ kind: 'busy' });
    expect(
      evaluateProductPersist(blankProduct(), false, { saving: false, status: 'loading' }),
    ).toEqual({ kind: 'busy' });
  });

  it('blocks publish when either name locale is empty', () => {
    expect(
      evaluateProductPersist(blankProduct(), true, { saving: false, status: 'ready' }),
    ).toEqual({ kind: 'nameError', step: 0 });
  });

  it('allows draft save without names but still validates summary length', () => {
    const long = draft((product) => {
      product.summary = { ar: 'x'.repeat(301), en: 'ok' };
    });
    expect(productSummaryLocalesValid(long)).toBe(false);
    expect(invalidSummaryLocale(long)).toBe('ar');
    expect(evaluateProductPersist(long, false, { saving: false, status: 'ready' })).toEqual({
      kind: 'summaryInvalid',
      step: 0,
      locale: 'ar',
    });
  });

  it('blocks on the first repeater issue before SEO', () => {
    const product = draft((item) => {
      item.name = { ar: 'أ', en: 'A' };
      item.features[0] = {
        ...item.features[0],
        id: 'local-feature',
        title: { ar: '', en: 'Only EN' },
        body: { ar: 'نص', en: 'Body' },
      };
    });
    expect(evaluateProductPersist(product, true, { saving: false, status: 'ready' })).toEqual({
      kind: 'repeaterInvalid',
      step: 0,
      preferAr: true,
    });
  });

  it('blocks on SEO after earlier gates pass', () => {
    const product = draft((item) => {
      item.name = { ar: 'أ', en: 'A' };
      item.seo.slug = { ar: 'Bad Slug', en: 'ok' };
    });
    expect(evaluateProductPersist(product, true, { saving: false, status: 'ready' })).toEqual({
      kind: 'seoInvalid',
      step: SEO_STEP_INDEX,
      locale: 'ar',
    });
  });

  it('returns a ready product with the requested published flag', () => {
    const product = draft((item) => {
      item.name = { ar: 'أ', en: 'A' };
      item.id = 'info-system';
    });
    const result = evaluateProductPersist(product, true, { saving: false, status: 'ready' });
    expect(result).toEqual({ kind: 'ready', product: { ...product, published: true } });
  });

  it('maps the first server error path to locale and step', () => {
    expect(resolveServerErrorFocus({})).toEqual({ language: null, stepIndex: -1 });
    expect(resolveServerErrorFocus({ 'slug': ['taken'] })).toEqual({
      language: null,
      stepIndex: SEO_STEP_INDEX,
    });
    expect(resolveServerErrorFocus({ 'title.ar': ['required'], 'slug': ['taken'] })).toEqual({
      language: 'ar',
      stepIndex: 0,
    });
  });
});
