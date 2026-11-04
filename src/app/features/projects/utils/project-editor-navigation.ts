import type { AppLanguage } from '../../../core/i18n/translations';
import { PROJECT_STEPS, SEO_STEP_INDEX } from '../constants/project-steps';
import type { Project } from '../models/project.model';
import { isValidMetaKeywords, isValidProjectSlug, projectNamesValid } from './project-field-rules';

export type ProjectEditorMode = 'create' | 'edit';

export interface ProjectEditorNavInput {
  mode: ProjectEditorMode;
  saving: boolean;
  step: number;
  draft: Project;
}

export type ProjectEditorNavDecision =
  | { kind: 'noop' }
  | { kind: 'setStep'; step: number }
  | { kind: 'advance'; from: number }
  | { kind: 'nameError' }
  | { kind: 'navigateList' }
  | { kind: 'blocked'; locale?: AppLanguage };

export function projectSlugLocalesValid(project: Project): boolean {
  const { slug } = project.seo;
  return isValidProjectSlug(slug.ar) && isValidProjectSlug(slug.en);
}

export function projectMetaKeywordsLocalesValid(project: Project): boolean {
  const { keywords } = project.seo;
  return isValidMetaKeywords(keywords.ar) && isValidMetaKeywords(keywords.en);
}

export function projectSeoStepValid(project: Project): boolean {
  return projectSlugLocalesValid(project) && projectMetaKeywordsLocalesValid(project);
}

/** Locale to switch to when SEO leave/save is blocked; null when SEO is valid. */
export function invalidSeoLocale(project: Project): AppLanguage | null {
  const { slug, keywords } = project.seo;
  if (!isValidProjectSlug(slug.ar)) {
    return 'ar';
  }
  if (!isValidProjectSlug(slug.en)) {
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
 * Projects only gate the SEO step (no identity workflow leave gate).
 */
export function canLeaveProjectEditorStep(
  currentStep: number,
  target: number,
  draft: Project,
): { ok: true } | { ok: false; locale?: AppLanguage } {
  if (currentStep === SEO_STEP_INDEX && target !== SEO_STEP_INDEX) {
    if (!projectSeoStepValid(draft)) {
      const locale = invalidSeoLocale(draft) ?? undefined;
      return { ok: false, locale };
    }
  }
  return { ok: true };
}

export function decideSelectStep(
  input: ProjectEditorNavInput,
  index: number | undefined,
): ProjectEditorNavDecision {
  if (input.saving || index === undefined || (input.mode === 'create' && index > input.step)) {
    return { kind: 'noop' };
  }
  const leave = canLeaveProjectEditorStep(input.step, index, input.draft);
  if (!leave.ok) {
    return { kind: 'blocked', locale: leave.locale };
  }
  return { kind: 'setStep', step: index };
}

export function decideNextStep(input: ProjectEditorNavInput): ProjectEditorNavDecision {
  const lastStep = input.step === PROJECT_STEPS.length - 1;
  if (input.saving || lastStep) {
    return { kind: 'noop' };
  }
  if (input.mode === 'create' && input.step === 0 && !projectNamesValid(input.draft)) {
    return { kind: 'nameError' };
  }
  const leave = canLeaveProjectEditorStep(input.step, input.step + 1, input.draft);
  if (!leave.ok) {
    return { kind: 'blocked', locale: leave.locale };
  }
  return { kind: 'advance', from: input.step };
}

export function decidePreviousStep(input: ProjectEditorNavInput): ProjectEditorNavDecision {
  if (input.saving) {
    return { kind: 'noop' };
  }
  if (input.step === 0) {
    return { kind: 'navigateList' };
  }
  const leave = canLeaveProjectEditorStep(input.step, input.step - 1, input.draft);
  if (!leave.ok) {
    return { kind: 'blocked', locale: leave.locale };
  }
  return { kind: 'setStep', step: input.step - 1 };
}
