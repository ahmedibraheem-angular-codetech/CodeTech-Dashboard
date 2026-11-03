import { describe, expect, it } from 'vitest';

import {
  isValidMetaKeywords,
  isValidProjectSlug,
  isValidProjectSummary,
  longestProjectKeywordLength,
  splitProjectKeywords,
} from './project-field-rules';

describe('project-field-rules', () => {
  it('treats empty slug as valid and rejects invalid patterns', () => {
    expect(isValidProjectSlug('')).toBe(true);
    expect(isValidProjectSlug('   ')).toBe(true);
    expect(isValidProjectSlug('my-project')).toBe(true);
    expect(isValidProjectSlug('My-Project')).toBe(false);
    expect(isValidProjectSlug('bad_slug')).toBe(false);
  });

  it('enforces the summary max length', () => {
    expect(isValidProjectSummary('a'.repeat(300))).toBe(true);
    expect(isValidProjectSummary('a'.repeat(301))).toBe(false);
  });

  it('splits keywords on Latin and Arabic commas and measures the longest token', () => {
    expect(splitProjectKeywords('one, two، three')).toEqual(['one', 'two', 'three']);
    expect(longestProjectKeywordLength('short, ' + 'x'.repeat(50))).toBe(50);
    expect(isValidMetaKeywords('ok, ' + 'x'.repeat(50))).toBe(true);
    expect(isValidMetaKeywords('ok, ' + 'x'.repeat(51))).toBe(false);
  });
});
