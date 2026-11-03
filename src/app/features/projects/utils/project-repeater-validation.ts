import type {
  LocaleText,
  LocalizedMedia,
  Project,
  ProjectIdentityButton,
  ProjectPoint,
} from '../models/project.model';
import { localeFilled } from './project-field-rules';

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

function slotHasMedia(slot: { imageUrl?: string; imageUuid?: string | null }): boolean {
  const url = slot.imageUrl?.trim() ?? '';
  if (url.length > 0) {
    return true;
  }
  return typeof slot.imageUuid === 'string' && slot.imageUuid.trim().length > 0;
}

function hasMedia(image: LocalizedMedia): boolean {
  return slotHasMedia(image.ar) || slotHasMedia(image.en);
}

/** Matches `toProjectWrite` inclusion for point-like rows. */
export function pointHasContent(item: ProjectPoint): boolean {
  return localeFilled(item.title) || localeFilled(item.body) || hasMedia(item.image);
}

function newPointNeedsArTitleBody(item: ProjectPoint): boolean {
  return isNewRepeaterItem(item.id) && pointHasContent(item);
}

export function isNewPointTitleBodyValid(item: ProjectPoint): boolean {
  if (!newPointNeedsArTitleBody(item)) {
    return true;
  }
  return arFilled(item.title) && arFilled(item.body);
}

export function newPointTitleArMissing(item: ProjectPoint): boolean {
  return newPointNeedsArTitleBody(item) && !arFilled(item.title);
}

export function newPointBodyArMissing(item: ProjectPoint): boolean {
  return newPointNeedsArTitleBody(item) && !arFilled(item.body);
}

function identityHasContent(item: ProjectIdentityButton): boolean {
  return (
    localeFilled(item.title) ||
    localeFilled(item.body) ||
    item.images.some((image) => hasMedia(image.image))
  );
}

/** Backend requires Arabic title + short_description when the identity row is sent. */
function newIdentityNeedsArTitleBody(item: ProjectIdentityButton): boolean {
  return isNewRepeaterItem(item.id) && identityHasContent(item);
}

export function isNewIdentityTitleBodyValid(item: ProjectIdentityButton): boolean {
  if (!newIdentityNeedsArTitleBody(item)) {
    return true;
  }
  return arFilled(item.title) && arFilled(item.body);
}

export function newIdentityTitleArMissing(item: ProjectIdentityButton): boolean {
  return newIdentityNeedsArTitleBody(item) && !arFilled(item.title);
}

export function newIdentityBodyArMissing(item: ProjectIdentityButton): boolean {
  return newIdentityNeedsArTitleBody(item) && !arFilled(item.body);
}

export type ProjectRepeaterStepIndex = 0 | 1 | 2 | 3 | 4 | 5;

export interface ProjectRepeaterIssue {
  step: ProjectRepeaterStepIndex;
  preferAr: boolean;
}

/**
 * First failing repeater rule, in wizard order:
 * about(0) → challenges(1) → solutions(2) → features(3) → results(4) → identity(5).
 */
export function firstRepeaterValidationIssue(project: Project): ProjectRepeaterIssue | null {
  if (
    project.categories.some((item) => !isNewPointTitleBodyValid(item)) ||
    project.aboutCards.some((item) => !isNewPointTitleBodyValid(item))
  ) {
    return { step: 0, preferAr: true };
  }
  if (project.challenges.some((item) => !isNewPointTitleBodyValid(item))) {
    return { step: 1, preferAr: true };
  }
  if (project.solutions.some((item) => !isNewPointTitleBodyValid(item))) {
    return { step: 2, preferAr: true };
  }
  if (project.features.some((item) => !isNewPointTitleBodyValid(item))) {
    return { step: 3, preferAr: true };
  }
  if (project.results.some((item) => !isNewPointTitleBodyValid(item))) {
    return { step: 4, preferAr: true };
  }
  if (project.identityButtons.some((item) => !isNewIdentityTitleBodyValid(item))) {
    return { step: 5, preferAr: true };
  }
  return null;
}

export function projectRepeatersValid(project: Project): boolean {
  return firstRepeaterValidationIssue(project) === null;
}
