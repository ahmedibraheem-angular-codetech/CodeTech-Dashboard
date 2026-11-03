import type { AppLanguage } from '../../../core/i18n/language';
import type { FieldErrors } from '../../../core/http/api-error';
import { PRODUCT_STEPS } from './product.model';

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
