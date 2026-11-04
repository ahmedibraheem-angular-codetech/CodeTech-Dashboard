import type { AppLanguage } from '../../../core/i18n/translations';
import { IDENTITY_STEP_INDEX, PRODUCT_STEPS, SEO_STEP_INDEX } from '../constants/product-steps';
import type { Product } from '../models/product.model';
import { isValidMetaKeywords, isValidProductSlug } from './product-field-rules';
import { isWorkflowStepArabicValid } from './product-repeater-validation';

export type ProductEditorMode = 'create' | 'edit';

export interface ProductEditorNavInput {
  mode: ProductEditorMode;
  saving: boolean;
  step: number;
  draft: Product;
}

export type ProductEditorNavDecision =
  | { kind: 'noop' }
  | { kind: 'setStep'; step: number }
  | { kind: 'advance'; from: number }
  | { kind: 'nameError' }
  | { kind: 'navigateList' }
  | { kind: 'blocked'; locale?: AppLanguage };

export function productNamesValid(product: Product): boolean {
  const { name } = product;
  return name.ar.trim().length > 0 && name.en.trim().length > 0;
}

export function productSlugLocalesValid(product: Product): boolean {
  const { slug } = product.seo;
  return isValidProductSlug(slug.ar) && isValidProductSlug(slug.en);
}

export function productMetaKeywordsLocalesValid(product: Product): boolean {
  const { keywords } = product.seo;
  return isValidMetaKeywords(keywords.ar) && isValidMetaKeywords(keywords.en);
}

export function productSeoStepValid(product: Product): boolean {
  return productSlugLocalesValid(product) && productMetaKeywordsLocalesValid(product);
}

export function productWorkflowStepsValid(product: Product): boolean {
  return product.steps.every((step) => isWorkflowStepArabicValid(step));
}

/** Locale to switch to when SEO leave/save is blocked; null when SEO is valid. */
export function invalidSeoLocale(product: Product): AppLanguage | null {
  const { slug, keywords } = product.seo;
  if (!isValidProductSlug(slug.ar)) {
    return 'ar';
  }
  if (!isValidProductSlug(slug.en)) {
    return 'en';
  }
  if (!isValidMetaKeywords(keywords.ar)) {
    return 'ar';
  }
  if (!isValidMetaKeywords(keywords.en)) {
    return 'en';
  }
  return null;
}

/**
 * Whether the wizard may leave `currentStep` for `target`.
 * On block, optionally returns a locale that should become active (same side effects as before).
 */
export function canLeaveProductEditorStep(
  currentStep: number,
  target: number,
  draft: Product,
): { ok: true } | { ok: false; locale?: AppLanguage } {
  if (currentStep === IDENTITY_STEP_INDEX && target !== IDENTITY_STEP_INDEX) {
    if (!productWorkflowStepsValid(draft)) {
      return { ok: false, locale: 'ar' };
    }
  }
  if (currentStep === SEO_STEP_INDEX && target !== SEO_STEP_INDEX) {
    if (!productSeoStepValid(draft)) {
      const locale = invalidSeoLocale(draft) ?? undefined;
      return { ok: false, locale };
    }
  }
  return { ok: true };
}

export function decideSelectStep(
  input: ProductEditorNavInput,
  index: number | undefined,
): ProductEditorNavDecision {
  if (input.saving || index === undefined || (input.mode === 'create' && index > input.step)) {
    return { kind: 'noop' };
  }
  const leave = canLeaveProductEditorStep(input.step, index, input.draft);
  if (!leave.ok) {
    return { kind: 'blocked', locale: leave.locale };
  }
  return { kind: 'setStep', step: index };
}

export function decideNextStep(input: ProductEditorNavInput): ProductEditorNavDecision {
  const lastStep = input.step === PRODUCT_STEPS.length - 1;
  if (input.saving || lastStep) {
    return { kind: 'noop' };
  }
  if (input.mode === 'create' && input.step === 0 && !productNamesValid(input.draft)) {
    return { kind: 'nameError' };
  }
  const leave = canLeaveProductEditorStep(input.step, input.step + 1, input.draft);
  if (!leave.ok) {
    return { kind: 'blocked', locale: leave.locale };
  }
  return { kind: 'advance', from: input.step };
}

export function decidePreviousStep(input: ProductEditorNavInput): ProductEditorNavDecision {
  if (input.saving) {
    return { kind: 'noop' };
  }
  if (input.step === 0) {
    return { kind: 'navigateList' };
  }
  const leave = canLeaveProductEditorStep(input.step, input.step - 1, input.draft);
  if (!leave.ok) {
    return { kind: 'blocked', locale: leave.locale };
  }
  return { kind: 'setStep', step: input.step - 1 };
}
