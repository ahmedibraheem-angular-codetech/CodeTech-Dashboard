import type { LocaleText, ProductPoint } from './product.model';

function localeFilled(value: LocaleText): boolean {
  return !!(value.ar.trim() || value.en.trim());
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
