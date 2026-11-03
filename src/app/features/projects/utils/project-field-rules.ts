import {
  PROJECT_META_KEYWORD_MAX,
  PROJECT_SLUG_PATTERN,
  PROJECT_SUMMARY_MAX,
} from '../constants/project-limits';
import type { LocaleText, Project } from '../models/project.model';

/** True when either locale has non-whitespace text. */
export function localeFilled(value: LocaleText): boolean {
  return !!(value.ar.trim() || value.en.trim());
}

/** Publish/create gate: both Arabic and English names required. */
export function projectNamesValid(project: Project): boolean {
  return project.name.ar.trim().length > 0 && project.name.en.trim().length > 0;
}

/** True when empty/whitespace (optional) or the trimmed value matches `PROJECT_SLUG_PATTERN`. */
export function isValidProjectSlug(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 0 || PROJECT_SLUG_PATTERN.test(trimmed);
}

export function isValidProjectSummary(value: string): boolean {
  return value.length <= PROJECT_SUMMARY_MAX;
}

/** Same split rules as `toProjectWrite` (`/[,،]/`, trim, drop empties). */
export function splitProjectKeywords(value: string): string[] {
  return value
    .split(/[,،]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function longestProjectKeywordLength(value: string): number {
  return splitProjectKeywords(value).reduce((max, keyword) => Math.max(max, keyword.length), 0);
}

export function isValidMetaKeywords(value: string): boolean {
  return splitProjectKeywords(value).every((keyword) => keyword.length <= PROJECT_META_KEYWORD_MAX);
}
