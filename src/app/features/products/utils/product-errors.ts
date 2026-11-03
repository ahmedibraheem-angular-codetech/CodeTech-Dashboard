import type { AppLanguage } from '../../../core/i18n/language';
import type { FieldErrors } from '../../../core/http/api-error';
import { PRODUCT_STEPS } from '../constants/product-steps';
import type { Product } from '../models/product.model';
import {
  newFaqAnswerArMissing,
  newFaqQuestionArMissing,
  newIntegrationImageMissing,
  newPointBodyArMissing,
  newPointTitleArMissing,
  newPointTitleOnlyArMissing,
  newStatTitleArMissing,
  newStatValueArMissing,
  newUnitTitleArMissing,
  sectorImageArMissing,
  workflowStepBodyArMissing,
  workflowStepTitleArMissing,
} from './product-repeater-validation';

export function serverErrorMessage(errors: FieldErrors, path: string): string {
  return errors[path]?.[0] ?? '';
}

/** First message whose key equals `prefix` or starts with `prefix.`. */
export function serverErrorPrefixMessage(errors: FieldErrors, prefix: string): string {
  if (errors[prefix]?.[0]) {
    return errors[prefix][0]!;
  }
  const nested = `${prefix}.`;
  for (const [key, messages] of Object.entries(errors)) {
    if (key.startsWith(nested) && messages[0]) {
      return messages[0];
    }
  }
  return '';
}

export function clearServerErrorPaths(errors: FieldErrors, paths: readonly string[]): FieldErrors {
  if (paths.length === 0) {
    return errors;
  }
  const drop = new Set(paths);
  const next: Record<string, readonly string[]> = {};
  for (const [key, messages] of Object.entries(errors)) {
    if (!drop.has(key)) {
      next[key] = messages;
    }
  }
  return next;
}

export function clearServerErrorPrefix(errors: FieldErrors, prefix: string): FieldErrors {
  const nested = `${prefix}.`;
  const next: Record<string, readonly string[]> = {};
  for (const [key, messages] of Object.entries(errors)) {
    if (key !== prefix && !key.startsWith(nested)) {
      next[key] = messages;
    }
  }
  return next;
}

export function localeFromServerPath(path: string): AppLanguage | null {
  const match = path.match(/(?:^|\.)(ar|en)(?:\.|$)/);
  return match?.[1] === 'ar' || match?.[1] === 'en' ? match[1] : null;
}

/** Wizard step index for a Laravel-style dotted product write error key. */
export function productStepIndexForServerPath(path: string): number {
  const root = path.split('.')[0] ?? '';
  const id = (() => {
    switch (root) {
      case 'title':
      case 'short_description':
      case 'description':
      case 'cover':
      case 'cover_title':
      case 'cover_alt':
      case 'thumbnail':
      case 'thumbnail_title':
      case 'thumbnail_alt':
      case 'features':
      case 'stats':
        return 'info';
      case 'sectors':
      case 'challenges':
      case 'solution_title':
      case 'solution_description':
      case 'solution_image':
        return 'sectors';
      case 'offerings':
      case 'results':
        return 'offer';
      case 'advantages':
      case 'integrations':
        return 'tools';
      case 'modules':
        return 'units';
      case 'workflow_steps':
      case 'identity_items':
      case 'reasons':
        return 'identity';
      case 'faqs':
        return 'faq';
      case 'slug':
      case 'meta_title':
      case 'meta_description':
      case 'meta_keywords':
        return 'seo';
      default:
        return null;
    }
  })();
  if (!id) {
    return -1;
  }
  return PRODUCT_STEPS.findIndex((step) => step.id === id);
}

export type ProductCopy = (key: string) => string;

type PointErrorList = 'features' | 'challenges' | 'offer' | 'results';

function firstServerMessage(errors: FieldErrors, ...paths: string[]): string {
  for (const path of paths) {
    const message = serverErrorMessage(errors, path);
    if (message) {
      return message;
    }
  }
  return '';
}

export function isSectorArabicImageInvalid(product: Product, index: number): boolean {
  const sector = product.sectors[index];
  return sector ? sectorImageArMissing(sector) : false;
}

export function sectorImageErrorMessage(
  product: Product,
  index: number,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  if (isSectorArabicImageInvalid(product, index)) {
    return copy('product.sectorImageArRequired');
  }
  return serverErrorMessage(errors, `sectors.${index}.image.ar`);
}

export function workflowStepTitleErrorMessage(
  product: Product,
  index: number,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  const step = product.steps[index];
  if (step && workflowStepTitleArMissing(step)) {
    return copy('product.stepTitleArRequired');
  }
  return firstServerMessage(
    errors,
    `workflow_steps.${index}.title.ar`,
    `workflow_steps.${index}.title.${language}`,
  );
}

export function workflowStepBodyErrorMessage(
  product: Product,
  index: number,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  const step = product.steps[index];
  if (step && workflowStepBodyArMissing(step)) {
    return copy('product.stepBodyArRequired');
  }
  return firstServerMessage(
    errors,
    `workflow_steps.${index}.short_description.ar`,
    `workflow_steps.${index}.short_description.${language}`,
  );
}

export function pointTitleBodyErrorMessage(
  product: Product,
  list: PointErrorList,
  index: number,
  field: 'title' | 'body',
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  const item = product[list][index];
  if (item) {
    if (field === 'title' && newPointTitleArMissing(item)) {
      return copy('product.required');
    }
    if (field === 'body' && newPointBodyArMissing(item)) {
      return copy('product.required');
    }
  }
  const apiList =
    list === 'offer'
      ? 'offerings'
      : list === 'features'
        ? 'features'
        : list === 'results'
          ? 'results'
          : 'challenges';
  const apiField = field === 'title' ? 'title' : 'short_description';
  return firstServerMessage(
    errors,
    `${apiList}.${index}.${apiField}.ar`,
    `${apiList}.${index}.${apiField}.${language}`,
  );
}

export function toolTitleBodyErrorMessage(
  product: Product,
  index: number,
  field: 'title' | 'body',
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  const item = product.tools[index];
  if (item) {
    if (field === 'title' && newPointTitleArMissing(item)) {
      return copy('product.required');
    }
    if (field === 'body' && newPointBodyArMissing(item)) {
      return copy('product.required');
    }
  }
  const apiField = field === 'title' ? 'title' : 'short_description';
  return firstServerMessage(
    errors,
    `advantages.${index}.${apiField}.ar`,
    `advantages.${index}.${apiField}.${language}`,
  );
}

export function integrationImageErrorMessage(
  product: Product,
  index: number,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  const item = product.integrations[index];
  if (item && newIntegrationImageMissing(item)) {
    return copy('product.imageRequired');
  }
  return serverErrorMessage(errors, `integrations.${index}.image`);
}

export function unitTitleErrorMessage(
  product: Product,
  index: number,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  const item = product.units[index];
  if (item && newUnitTitleArMissing(item)) {
    return copy('product.required');
  }
  return firstServerMessage(
    errors,
    `modules.${index}.title.ar`,
    `modules.${index}.title.${language}`,
  );
}

export function identityTitleErrorMessage(
  product: Product,
  index: number,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  const item = product.identity[index];
  if (item && newPointTitleOnlyArMissing(item)) {
    return copy('product.required');
  }
  return firstServerMessage(
    errors,
    `identity_items.${index}.title.ar`,
    `identity_items.${index}.title.${language}`,
  );
}

export function highlightTitleErrorMessage(
  product: Product,
  index: number,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  const item = product.highlights[index];
  if (item && newPointTitleOnlyArMissing(item)) {
    return copy('product.required');
  }
  return firstServerMessage(
    errors,
    `reasons.${index}.title.ar`,
    `reasons.${index}.title.${language}`,
  );
}

export function faqQuestionErrorMessage(
  product: Product,
  index: number,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  const item = product.faqs[index];
  if (item && newFaqQuestionArMissing(item)) {
    return copy('product.required');
  }
  return firstServerMessage(
    errors,
    `faqs.${index}.question.ar`,
    `faqs.${index}.question.${language}`,
  );
}

export function faqAnswerErrorMessage(
  product: Product,
  index: number,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  const item = product.faqs[index];
  if (item && newFaqAnswerArMissing(item)) {
    return copy('product.required');
  }
  return firstServerMessage(errors, `faqs.${index}.answer.ar`, `faqs.${index}.answer.${language}`);
}

export function statTitleErrorMessage(
  product: Product,
  index: number,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  const item = product.stats[index];
  if (item && newStatTitleArMissing(item)) {
    return copy('product.required');
  }
  return firstServerMessage(errors, `stats.${index}.title.ar`, `stats.${index}.title.${language}`);
}

export function statValueErrorMessage(
  product: Product,
  index: number,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  const item = product.stats[index];
  if (item && newStatValueArMissing(item)) {
    return copy('product.required');
  }
  return firstServerMessage(errors, `stats.${index}.value.ar`, `stats.${index}.value.${language}`);
}

export function slugErrorMessage(
  slugInvalid: boolean,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  if (slugInvalid) {
    return copy('product.seoSlugError');
  }
  return serverErrorMessage(errors, 'slug');
}

export function summaryErrorMessage(
  summaryInvalid: boolean,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  if (summaryInvalid) {
    return copy('product.summaryMaxError');
  }
  return firstServerMessage(errors, `short_description.${language}`, `description.${language}`);
}

export function keywordsErrorMessage(
  keywordsInvalid: boolean,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  if (keywordsInvalid) {
    return copy('product.seoKeywordsMaxError');
  }
  return serverErrorPrefixMessage(errors, `meta_keywords.${language}`);
}

export function nameErrorMessage(
  nameError: boolean,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProductCopy,
): string {
  if (nameError) {
    return copy('product.required');
  }
  return serverErrorMessage(errors, `title.${language}`);
}
