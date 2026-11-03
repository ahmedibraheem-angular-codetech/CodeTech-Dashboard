import type {
  LocaleText,
  LocalizedMedia,
  Product,
  ProductFaq,
  ProductImage,
  ProductMedia,
  ProductPoint,
  ProductSector,
  ProductStat,
  ProductUnit,
} from './product.model';
import { isSectorArabicImageValid, sectorHasAnyMedia } from './product-sector-media';
import {
  isWorkflowStepArabicValid,
  workflowStepBodyArMissing,
  workflowStepHasContent,
  workflowStepTitleArMissing,
} from './product-workflow-step';

/** Server-persisted nested row ids are numeric strings. Client placeholders are not. */
export function isServerItemId(id: string): boolean {
  return /^\d+$/.test(id);
}

export function isNewRepeaterItem(id: string): boolean {
  return !isServerItemId(id);
}

function localeFilled(value: LocaleText): boolean {
  return !!(value.ar.trim() || value.en.trim());
}

function arFilled(value: LocaleText): boolean {
  return value.ar.trim().length > 0;
}

/** Any non-empty image URL (remote, blob) or known UUID counts as present. Cleared slots do not. */
export function slotHasImage(image: ProductImage): boolean {
  const url = image.imageUrl?.trim() ?? '';
  if (url.length > 0) {
    return true;
  }
  return typeof image.imageUuid === 'string' && image.imageUuid.trim().length > 0;
}

export function hasSharedMedia(image: LocalizedMedia): boolean {
  return slotHasImage(image.ar) || slotHasImage(image.en);
}

export function hasArabicMedia(image: LocalizedMedia): boolean {
  return slotHasImage(image.ar);
}

function pointHasContent(item: ProductPoint | ProductMedia): boolean {
  return localeFilled(item.title) || localeFilled(item.body) || hasSharedMedia(item.image);
}

function statHasContent(item: ProductStat): boolean {
  return localeFilled(item.label) || localeFilled(item.value) || hasSharedMedia(item.image);
}

function faqHasContent(item: ProductFaq): boolean {
  return localeFilled(item.question) || localeFilled(item.answer);
}

function unitHasContent(item: ProductUnit): boolean {
  return localeFilled(item.title) || localeFilled(item.body) || hasSharedMedia(item.image);
}

/**
 * New (client-id) rows that will be sent must satisfy Arabic required fields.
 * Empty placeholder rows and existing server rows are skipped for these checks.
 */
export function newPointRequiresArTitleBody(item: ProductPoint | ProductMedia): boolean {
  return isNewRepeaterItem(item.id) && pointHasContent(item);
}

export function isNewPointTitleBodyValid(item: ProductPoint | ProductMedia): boolean {
  if (!newPointRequiresArTitleBody(item)) {
    return true;
  }
  return arFilled(item.title) && arFilled(item.body);
}

export function newPointTitleArMissing(item: ProductPoint | ProductMedia): boolean {
  return newPointRequiresArTitleBody(item) && !arFilled(item.title);
}

export function newPointBodyArMissing(item: ProductPoint | ProductMedia): boolean {
  return newPointRequiresArTitleBody(item) && !arFilled(item.body);
}

export function newPointRequiresArTitle(item: ProductPoint | ProductMedia): boolean {
  return isNewRepeaterItem(item.id) && pointHasContent(item);
}

export function isNewPointTitleValid(item: ProductPoint | ProductMedia): boolean {
  if (!newPointRequiresArTitle(item)) {
    return true;
  }
  return arFilled(item.title);
}

export function newPointTitleOnlyArMissing(item: ProductPoint | ProductMedia): boolean {
  return newPointRequiresArTitle(item) && !arFilled(item.title);
}

export function newStatRequiresArFields(item: ProductStat): boolean {
  return isNewRepeaterItem(item.id) && statHasContent(item);
}

export function isNewStatValid(item: ProductStat): boolean {
  if (!newStatRequiresArFields(item)) {
    return true;
  }
  return arFilled(item.label) && arFilled(item.value);
}

export function newStatTitleArMissing(item: ProductStat): boolean {
  return newStatRequiresArFields(item) && !arFilled(item.label);
}

export function newStatValueArMissing(item: ProductStat): boolean {
  return newStatRequiresArFields(item) && !arFilled(item.value);
}

export function newUnitRequiresArTitle(item: ProductUnit): boolean {
  return isNewRepeaterItem(item.id) && unitHasContent(item);
}

export function isNewUnitValid(item: ProductUnit): boolean {
  if (!newUnitRequiresArTitle(item)) {
    return true;
  }
  return arFilled(item.title);
}

export function newUnitTitleArMissing(item: ProductUnit): boolean {
  return newUnitRequiresArTitle(item) && !arFilled(item.title);
}

export function newFaqRequiresArFields(item: ProductFaq): boolean {
  return isNewRepeaterItem(item.id) && faqHasContent(item);
}

export function isNewFaqValid(item: ProductFaq): boolean {
  if (!newFaqRequiresArFields(item)) {
    return true;
  }
  return arFilled(item.question) && arFilled(item.answer);
}

export function newFaqQuestionArMissing(item: ProductFaq): boolean {
  return newFaqRequiresArFields(item) && !arFilled(item.question);
}

export function newFaqAnswerArMissing(item: ProductFaq): boolean {
  return newFaqRequiresArFields(item) && !arFilled(item.answer);
}

/**
 * Integrations: new rows with any content require a shared image
 * (existing UUID URL, blob preview, or uuid). Cleared images are invalid.
 */
export function newIntegrationRequiresImage(item: ProductMedia): boolean {
  return isNewRepeaterItem(item.id) && pointHasContent(item);
}

export function isNewIntegrationImageValid(item: ProductMedia): boolean {
  if (!newIntegrationRequiresImage(item)) {
    return true;
  }
  return hasSharedMedia(item.image);
}

export function newIntegrationImageMissing(item: ProductMedia): boolean {
  return newIntegrationRequiresImage(item) && !hasSharedMedia(item.image);
}

/** Sectors already included in the payload still need Arabic media (existing + new). */
export function isSectorItemValid(item: ProductSector): boolean {
  return isSectorArabicImageValid(item);
}

export function sectorImageArMissing(item: ProductSector): boolean {
  return sectorHasAnyMedia(item) && !hasArabicMedia(item.image);
}

export type ProductRepeaterStepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ProductRepeaterIssue {
  step: ProductRepeaterStepIndex;
  /** Prefer Arabic when the missing field is `.ar`. */
  preferAr: boolean;
}

/**
 * First failing repeater rule, in wizard order.
 * Workflow keeps its existing Arabic title+body rule for all contentful rows.
 */
export function firstRepeaterValidationIssue(product: Product): ProductRepeaterIssue | null {
  if (
    product.features.some((item) => !isNewPointTitleBodyValid(item)) ||
    product.stats.some((item) => !isNewStatValid(item))
  ) {
    return { step: 0, preferAr: true };
  }
  if (
    product.sectors.some((item) => !isSectorItemValid(item)) ||
    product.challenges.some((item) => !isNewPointTitleBodyValid(item))
  ) {
    return { step: 1, preferAr: true };
  }
  if (
    product.offer.some((item) => !isNewPointTitleBodyValid(item)) ||
    product.results.some((item) => !isNewPointTitleBodyValid(item))
  ) {
    return { step: 2, preferAr: true };
  }
  if (
    product.tools.some((item) => !isNewPointTitleBodyValid(item)) ||
    product.integrations.some((item) => !isNewIntegrationImageValid(item))
  ) {
    return { step: 3, preferAr: true };
  }
  if (product.units.some((item) => !isNewUnitValid(item))) {
    return { step: 4, preferAr: true };
  }
  if (
    product.identity.some((item) => !isNewPointTitleValid(item)) ||
    product.steps.some((item) => !isWorkflowStepArabicValid(item))
  ) {
    return { step: 5, preferAr: true };
  }
  if (
    product.highlights.some((item) => !isNewPointTitleValid(item)) ||
    product.faqs.some((item) => !isNewFaqValid(item))
  ) {
    return { step: 6, preferAr: true };
  }
  return null;
}

export function productRepeatersValid(product: Product): boolean {
  return firstRepeaterValidationIssue(product) === null;
}

export {
  isWorkflowStepArabicValid,
  workflowStepBodyArMissing,
  workflowStepHasContent,
  workflowStepTitleArMissing,
};
