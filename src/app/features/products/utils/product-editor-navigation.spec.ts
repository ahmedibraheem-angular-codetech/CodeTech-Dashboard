import { IDENTITY_STEP_INDEX, PRODUCT_STEPS, SEO_STEP_INDEX } from '../constants/product-steps';
import { blankProduct, type Product } from '../models/product.model';
import {
  canLeaveProductEditorStep,
  decideNextStep,
  decidePreviousStep,
  decideSelectStep,
  invalidSeoLocale,
  productNamesValid,
  productSeoStepValid,
  type ProductEditorNavInput,
} from './product-editor-navigation';

function draft(patch: (product: Product) => void): Product {
  const product = blankProduct();
  patch(product);
  return product;
}

function nav(
  partial: Partial<ProductEditorNavInput> & Pick<ProductEditorNavInput, 'draft'>,
): ProductEditorNavInput {
  return {
    mode: 'edit',
    saving: false,
    step: 0,
    ...partial,
  };
}

describe('product-editor-navigation', () => {
  it('requires both locale names', () => {
    expect(productNamesValid(blankProduct())).toBe(false);
    expect(
      productNamesValid(
        draft((product) => {
          product.name = { ar: 'أ', en: 'A' };
        }),
      ),
    ).toBe(true);
  });

  it('blocks create select past the current step and allows edit jumps when leave gates pass', () => {
    const product = draft((item) => {
      item.name = { ar: 'أ', en: 'A' };
    });
    expect(decideSelectStep(nav({ mode: 'create', step: 0, draft: product }), 2)).toEqual({
      kind: 'noop',
    });
    expect(decideSelectStep(nav({ mode: 'edit', step: 0, draft: product }), 2)).toEqual({
      kind: 'setStep',
      step: 2,
    });
    expect(decideSelectStep(nav({ saving: true, draft: product }), 1)).toEqual({ kind: 'noop' });
    expect(decideSelectStep(nav({ draft: product }), undefined)).toEqual({ kind: 'noop' });
  });

  it('blocks next on create until both names are set', () => {
    expect(decideNextStep(nav({ mode: 'create', step: 0, draft: blankProduct() }))).toEqual({
      kind: 'nameError',
    });
    const named = draft((product) => {
      product.name = { ar: 'أ', en: 'A' };
    });
    expect(decideNextStep(nav({ mode: 'create', step: 0, draft: named }))).toEqual({
      kind: 'advance',
      from: 0,
    });
  });

  it('does not advance from the last step', () => {
    expect(
      decideNextStep(
        nav({
          step: PRODUCT_STEPS.length - 1,
          draft: blankProduct(),
        }),
      ),
    ).toEqual({ kind: 'noop' });
  });

  it('navigates to the list from step 0 and steps back otherwise', () => {
    expect(decidePreviousStep(nav({ step: 0, draft: blankProduct() }))).toEqual({
      kind: 'navigateList',
    });
    expect(decidePreviousStep(nav({ step: 2, draft: blankProduct() }))).toEqual({
      kind: 'setStep',
      step: 1,
    });
    expect(decidePreviousStep(nav({ saving: true, step: 2, draft: blankProduct() }))).toEqual({
      kind: 'noop',
    });
  });

  it('blocks leaving identity when a contentful workflow step lacks Arabic title or body', () => {
    const product = draft((item) => {
      item.steps[0] = {
        ...item.steps[0],
        title: { ar: '', en: 'Only English' },
        body: { ar: 'نص', en: 'Body' },
      };
    });
    expect(
      canLeaveProductEditorStep(IDENTITY_STEP_INDEX, IDENTITY_STEP_INDEX + 1, product),
    ).toEqual({ ok: false, locale: 'ar' });
    expect(decideNextStep(nav({ step: IDENTITY_STEP_INDEX, draft: product }))).toEqual({
      kind: 'blocked',
      locale: 'ar',
    });
  });

  it('blocks leaving SEO when slug or keywords are invalid and points at the bad locale', () => {
    const badSlug = draft((item) => {
      item.seo.slug = { ar: 'Bad Slug', en: 'ok-slug' };
    });
    expect(productSeoStepValid(badSlug)).toBe(false);
    expect(invalidSeoLocale(badSlug)).toBe('ar');
    expect(canLeaveProductEditorStep(SEO_STEP_INDEX, SEO_STEP_INDEX - 1, badSlug)).toEqual({
      ok: false,
      locale: 'ar',
    });

    const badKeywords = draft((item) => {
      item.seo.keywords = { ar: 'ok', en: 'x'.repeat(51) };
    });
    expect(invalidSeoLocale(badKeywords)).toBe('en');
    expect(decidePreviousStep(nav({ step: SEO_STEP_INDEX, draft: badKeywords }))).toEqual({
      kind: 'blocked',
      locale: 'en',
    });
  });

  it('allows leaving identity and SEO when their rules pass', () => {
    const product = blankProduct();
    expect(
      canLeaveProductEditorStep(IDENTITY_STEP_INDEX, IDENTITY_STEP_INDEX + 1, product),
    ).toEqual({ ok: true });
    expect(canLeaveProductEditorStep(SEO_STEP_INDEX, SEO_STEP_INDEX - 1, product)).toEqual({
      ok: true,
    });
  });
});
