import type { AppLanguage } from '../../../core/i18n/translations';
import type { FieldErrors } from '../../../core/http/api-error';
import { SEO_STEP_INDEX } from '../constants/project-steps';
import type { Project } from '../models/project.model';
import { localeFromServerPath, projectStepIndexForServerPath } from './project-errors';
import { isValidProjectSummary, projectNamesValid } from './project-field-rules';
import {
  firstRepeaterValidationIssue,
  projectRepeatersValid,
} from './project-repeater-validation';
import { invalidSeoLocale, projectSeoStepValid } from './project-editor-navigation';

export type ProjectEditorStatus = 'loading' | 'ready' | 'missing' | 'error' | 'offline';

export type ProjectPersistEvaluation =
  | { kind: 'busy' }
  | { kind: 'nameError'; step: 0 }
  | { kind: 'summaryInvalid'; step: 0; locale?: AppLanguage }
  | { kind: 'repeaterInvalid'; step: number; preferAr: boolean }
  | { kind: 'seoInvalid'; step: number; locale?: AppLanguage }
  | { kind: 'ready'; project: Project };

export interface ProjectServerErrorFocus {
  language: AppLanguage | null;
  stepIndex: number;
}

export function projectSummaryLocalesValid(project: Project): boolean {
  const { summary } = project;
  return isValidProjectSummary(summary.ar) && isValidProjectSummary(summary.en);
}

/** Locale to switch to when summary validation fails; undefined when both locales are valid. */
export function invalidSummaryLocale(project: Project): AppLanguage | undefined {
  const { summary } = project;
  if (!isValidProjectSummary(summary.ar)) {
    return 'ar';
  }
  if (!isValidProjectSummary(summary.en)) {
    return 'en';
  }
  return undefined;
}

/**
 * Pre-save gate evaluation in the same order as the previous private `persist` method.
 * HTTP, toasts, ObjectUrls, and signal writes stay in the component.
 */
export function evaluateProjectPersist(
  draft: Project,
  published: boolean,
  options: { saving: boolean; status: ProjectEditorStatus },
): ProjectPersistEvaluation {
  if (options.saving || options.status !== 'ready') {
    return { kind: 'busy' };
  }
  const project = { ...draft, published };
  if (published && !projectNamesValid(project)) {
    return { kind: 'nameError', step: 0 };
  }
  if (!projectSummaryLocalesValid(project)) {
    return { kind: 'summaryInvalid', step: 0, locale: invalidSummaryLocale(project) };
  }
  if (!projectRepeatersValid(project)) {
    const issue = firstRepeaterValidationIssue(project);
    if (!issue) {
      return { kind: 'busy' };
    }
    return { kind: 'repeaterInvalid', step: issue.step, preferAr: issue.preferAr };
  }
  if (!projectSeoStepValid(project)) {
    return {
      kind: 'seoInvalid',
      step: SEO_STEP_INDEX,
      locale: invalidSeoLocale(project) ?? undefined,
    };
  }
  return { kind: 'ready', project };
}

export function resolveServerErrorFocus(fieldErrors: FieldErrors): ProjectServerErrorFocus {
  const firstPath = Object.keys(fieldErrors)[0];
  if (!firstPath) {
    return { language: null, stepIndex: -1 };
  }
  return {
    language: localeFromServerPath(firstPath),
    stepIndex: projectStepIndexForServerPath(firstPath),
  };
}
