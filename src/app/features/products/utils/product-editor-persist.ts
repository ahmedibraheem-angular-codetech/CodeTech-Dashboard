import type { AppLanguage } from '../../../core/i18n/translations';
import type { FieldErrors } from '../../../core/http/api-error';
import { SEO_STEP_INDEX } from '../constants/product-steps';
import type { Product } from '../models/product.model';
import { localeFromServerPath, productStepIndexForServerPath } from './product-errors';
import { isValidShortDescription } from './product-field-rules';
import { firstRepeaterValidationIssue, productRepeatersValid } from './product-repeater-validation';
import {
  invalidSeoLocale,
  productNamesValid,
  productSeoStepValid,
} from './product-editor-navigation';

export type ProductEditorStatus = 'loading' | 'ready' | 'missing' | 'error' | 'offline';

export type ProductPersistEvaluation =
  | { kind: 'busy' }
  | { kind: 'nameError'; step: 0 }
  | { kind: 'summaryInvalid'; step: 0; locale?: AppLanguage }
  | { kind: 'repeaterInvalid'; step: number; preferAr: boolean }
  | { kind: 'seoInvalid'; step: number; locale?: AppLanguage }
  | { kind: 'ready'; product: Product };

export interface ProductServerErrorFocus {
  language: AppLanguage | null;
  stepIndex: number;
}

export function productSummaryLocalesValid(product: Product): boolean {
  const { summary } = product;
  return isValidShortDescription(summary.ar) && isValidShortDescription(summary.en);
}

/** Locale to switch to when summary validation fails; undefined when both locales are valid. */
export function invalidSummaryLocale(product: Product): AppLanguage | undefined {
  const { summary } = product;
  if (!isValidShortDescription(summary.ar)) {
    return 'ar';
  }
  if (!isValidShortDescription(summary.en)) {
    return 'en';
  }
  return undefined;
}

/**
 * Pre-save gate evaluation in the same order as the previous private `persist` method.
 * HTTP, toasts, ObjectUrls, and signal writes stay in the component.
 */
export function evaluateProductPersist(
  draft: Product,
  published: boolean,
  options: { saving: boolean; status: ProductEditorStatus },
): ProductPersistEvaluation {
  if (options.saving || options.status !== 'ready') {
    return { kind: 'busy' };
  }
  const product = { ...draft, published };
  if (published && !productNamesValid(product)) {
    return { kind: 'nameError', step: 0 };
  }
  if (!productSummaryLocalesValid(product)) {
    return { kind: 'summaryInvalid', step: 0, locale: invalidSummaryLocale(product) };
  }
  if (!productRepeatersValid(product)) {
    const issue = firstRepeaterValidationIssue(product);
    if (!issue) {
      return { kind: 'busy' };
    }
    return { kind: 'repeaterInvalid', step: issue.step, preferAr: issue.preferAr };
  }
  if (!productSeoStepValid(product)) {
    return {
      kind: 'seoInvalid',
      step: SEO_STEP_INDEX,
      locale: invalidSeoLocale(product) ?? undefined,
    };
  }
  return { kind: 'ready', product };
}

export function resolveServerErrorFocus(fieldErrors: FieldErrors): ProductServerErrorFocus {
  const firstPath = Object.keys(fieldErrors)[0];
  if (!firstPath) {
    return { language: null, stepIndex: -1 };
  }
  return {
    language: localeFromServerPath(firstPath),
    stepIndex: productStepIndexForServerPath(firstPath),
  };
}
