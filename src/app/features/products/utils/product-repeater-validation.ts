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
} from '../models/product.model';

function localeFilled(value: LocaleText): boolean {
  return !!(value.ar.trim() || value.en.trim());
}

function arFilled(value: LocaleText): boolean {
  return value.ar.trim().length > 0;
}

/** Server-persisted nested row ids are numeric strings. Client placeholders are not. */
export function isServerItemId(id: string): boolean {
  return /^\d+$/.test(id);
}

function isNewRepeaterItem(id: string): boolean {
  return !isServerItemId(id);
}

/** Any non-empty image URL (remote, blob) or known UUID counts as present. Cleared slots do not. */
export function slotHasImage(image: ProductImage): boolean {
  const url = image.imageUrl?.trim() ?? '';
  if (url.length > 0) {
    return true;
  }
  return typeof image.imageUuid === 'string' && image.imageUuid.trim().length > 0;
}

function hasSharedMedia(image: LocalizedMedia): boolean {
  return slotHasImage(image.ar) || slotHasImage(image.en);
}

function hasArabicMedia(image: LocalizedMedia): boolean {
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

/** Matches `toProductWrite` inclusion: any locale with an image URL. */
export function sectorHasAnyMedia(sector: ProductSector): boolean {
  return !!(sector.image.ar.imageUrl || sector.image.en.imageUrl);
}

/** Arabic image available (remote UUID URL or local blob preview). */
export function sectorHasArabicImage(sector: ProductSector): boolean {
  return !!sector.image.ar.imageUrl;
}

/**
 * Empty sectors (excluded from payload) are valid.
 * Payload-included sectors require an Arabic image; English alone is not enough.
 */
export function isSectorArabicImageValid(sector: ProductSector): boolean {
  return !sectorHasAnyMedia(sector) || sectorHasArabicImage(sector);
}

/** Matches `toProductWrite` inclusion for `workflow_steps` (title or body in any locale). */
export function workflowStepHasContent(step: ProductPoint): boolean {
  return localeFilled(step.title) || localeFilled(step.body);
}

/** Empty rows are optional; any content requires Arabic title and short description. */
export function isWorkflowStepArabicValid(step: ProductPoint): boolean {
  if (!workflowStepHasContent(step)) {
    return true;
  }
  return step.title.ar.trim().length > 0 && step.body.ar.trim().length > 0;
}

export function workflowStepTitleArMissing(step: ProductPoint): boolean {
  return workflowStepHasContent(step) && step.title.ar.trim().length === 0;
}

export function workflowStepBodyArMissing(step: ProductPoint): boolean {
  return workflowStepHasContent(step) && step.body.ar.trim().length === 0;
}

function newPointNeedsArTitleBody(item: ProductPoint | ProductMedia): boolean {
  return isNewRepeaterItem(item.id) && pointHasContent(item);
}

export function isNewPointTitleBodyValid(item: ProductPoint | ProductMedia): boolean {
  if (!newPointNeedsArTitleBody(item)) {
    return true;
  }
  return arFilled(item.title) && arFilled(item.body);
}

export function newPointTitleArMissing(item: ProductPoint | ProductMedia): boolean {
  return newPointNeedsArTitleBody(item) && !arFilled(item.title);
}

export function newPointBodyArMissing(item: ProductPoint | ProductMedia): boolean {
  return newPointNeedsArTitleBody(item) && !arFilled(item.body);
}

function isNewPointTitleValid(item: ProductPoint | ProductMedia): boolean {
  if (!newPointNeedsArTitleBody(item)) {
    return true;
  }
  return arFilled(item.title);
}

export function newPointTitleOnlyArMissing(item: ProductPoint | ProductMedia): boolean {
  return newPointNeedsArTitleBody(item) && !arFilled(item.title);
}

function newStatNeedsArFields(item: ProductStat): boolean {
  return isNewRepeaterItem(item.id) && statHasContent(item);
}

export function isNewStatValid(item: ProductStat): boolean {
  if (!newStatNeedsArFields(item)) {
    return true;
  }
  return arFilled(item.label) && arFilled(item.value);
}

export function newStatTitleArMissing(item: ProductStat): boolean {
  return newStatNeedsArFields(item) && !arFilled(item.label);
}

export function newStatValueArMissing(item: ProductStat): boolean {
  return newStatNeedsArFields(item) && !arFilled(item.value);
}

function newUnitNeedsArTitle(item: ProductUnit): boolean {
  return isNewRepeaterItem(item.id) && unitHasContent(item);
}

export function isNewUnitValid(item: ProductUnit): boolean {
  if (!newUnitNeedsArTitle(item)) {
    return true;
  }
  return arFilled(item.title);
}

export function newUnitTitleArMissing(item: ProductUnit): boolean {
  return newUnitNeedsArTitle(item) && !arFilled(item.title);
}

function newFaqNeedsArFields(item: ProductFaq): boolean {
  return isNewRepeaterItem(item.id) && faqHasContent(item);
}

export function isNewFaqValid(item: ProductFaq): boolean {
  if (!newFaqNeedsArFields(item)) {
    return true;
  }
  return arFilled(item.question) && arFilled(item.answer);
}

export function newFaqQuestionArMissing(item: ProductFaq): boolean {
  return newFaqNeedsArFields(item) && !arFilled(item.question);
}

export function newFaqAnswerArMissing(item: ProductFaq): boolean {
  return newFaqNeedsArFields(item) && !arFilled(item.answer);
}

function newIntegrationNeedsImage(item: ProductMedia): boolean {
  return isNewRepeaterItem(item.id) && pointHasContent(item);
}

export function isNewIntegrationImageValid(item: ProductMedia): boolean {
  if (!newIntegrationNeedsImage(item)) {
    return true;
  }
  return hasSharedMedia(item.image);
}

export function newIntegrationImageMissing(item: ProductMedia): boolean {
  return newIntegrationNeedsImage(item) && !hasSharedMedia(item.image);
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
    product.sectors.some((item) => !isSectorArabicImageValid(item)) ||
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
