import type { AppLanguage } from '../../../core/i18n/language';
import type { FieldErrors } from '../../../core/http/api-error';
import { PROJECT_STEPS } from '../constants/project-steps';
import type { Project } from '../models/project.model';
import {
  newIdentityBodyArMissing,
  newIdentityTitleArMissing,
  newPointBodyArMissing,
  newPointTitleArMissing,
} from './project-repeater-validation';

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

/** Wizard step index for a Laravel-style dotted project write error key. */
export function projectStepIndexForServerPath(path: string): number {
  const root = path.split('.')[0] ?? '';
  const id = (() => {
    switch (root) {
      case 'title':
      case 'description':
      case 'cover':
      case 'cover_title':
      case 'cover_alt':
      case 'thumbnail':
      case 'thumbnail_title':
      case 'thumbnail_alt':
      case 'tags':
      case 'overview_cards':
        return 'about';
      case 'challenges':
      case 'tools':
        return 'challenges';
      case 'solutions':
      case 'solutions_image':
      case 'solutions_image_title':
      case 'solutions_image_alt':
      case 'gallery':
        return 'solutions';
      case 'features':
        return 'features';
      case 'results':
        return 'results';
      case 'identity_items':
        return 'identity';
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
  return PROJECT_STEPS.findIndex((step) => step.id === id);
}

export type ProjectCopy = (key: string) => string;

type PointErrorList = 'categories' | 'aboutCards' | 'challenges' | 'solutions' | 'features' | 'results';

function firstServerMessage(errors: FieldErrors, ...paths: string[]): string {
  for (const path of paths) {
    const message = serverErrorMessage(errors, path);
    if (message) {
      return message;
    }
  }
  return '';
}

function apiListName(list: PointErrorList): string {
  switch (list) {
    case 'categories':
      return 'tags';
    case 'aboutCards':
      return 'overview_cards';
    case 'results':
      return 'results';
    default:
      return list;
  }
}

function apiBodyField(list: PointErrorList): string {
  return list === 'results' ? 'value' : 'short_description';
}

export function pointTitleBodyErrorMessage(
  project: Project,
  list: PointErrorList,
  index: number,
  field: 'title' | 'body',
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProjectCopy,
): string {
  const item = project[list][index];
  if (item) {
    if (field === 'title' && newPointTitleArMissing(item)) {
      return copy('project.required');
    }
    if (field === 'body' && newPointBodyArMissing(item)) {
      return copy('project.required');
    }
  }
  const apiList = apiListName(list);
  const apiField = field === 'title' ? 'title' : apiBodyField(list);
  return firstServerMessage(
    errors,
    `${apiList}.${index}.${apiField}.ar`,
    `${apiList}.${index}.${apiField}.${language}`,
  );
}

export function identityTitleErrorMessage(
  project: Project,
  index: number,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProjectCopy,
): string {
  const item = project.identityButtons[index];
  if (item && newIdentityTitleArMissing(item)) {
    return copy('project.required');
  }
  return firstServerMessage(
    errors,
    `identity_items.${index}.title.ar`,
    `identity_items.${index}.title.${language}`,
  );
}

export function identityBodyErrorMessage(
  project: Project,
  index: number,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProjectCopy,
): string {
  const item = project.identityButtons[index];
  if (item && newIdentityBodyArMissing(item)) {
    return copy('project.required');
  }
  return firstServerMessage(
    errors,
    `identity_items.${index}.short_description.ar`,
    `identity_items.${index}.short_description.${language}`,
  );
}

/** First human-readable message from a Laravel-style fieldErrors map. */
export function firstFieldErrorMessage(errors: FieldErrors): string {
  for (const messages of Object.values(errors)) {
    if (messages[0]) {
      return messages[0];
    }
  }
  return '';
}

export function slugErrorMessage(
  slugInvalid: boolean,
  errors: FieldErrors,
  copy: ProjectCopy,
): string {
  if (slugInvalid) {
    return copy('project.seoSlugError');
  }
  return serverErrorMessage(errors, 'slug');
}

export function summaryErrorMessage(
  summaryInvalid: boolean,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProjectCopy,
): string {
  if (summaryInvalid) {
    return copy('project.summaryMaxError');
  }
  return firstServerMessage(errors, `description.${language}`);
}

export function keywordsErrorMessage(
  keywordsInvalid: boolean,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProjectCopy,
): string {
  if (keywordsInvalid) {
    return copy('project.seoKeywordsMaxError');
  }
  return serverErrorPrefixMessage(errors, `meta_keywords.${language}`);
}

export function nameErrorMessage(
  nameError: boolean,
  language: AppLanguage,
  errors: FieldErrors,
  copy: ProjectCopy,
): string {
  if (nameError) {
    return copy('project.required');
  }
  return serverErrorMessage(errors, `title.${language}`);
}
