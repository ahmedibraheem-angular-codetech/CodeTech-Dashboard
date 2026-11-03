import { describe, expect, it } from 'vitest';

import {
  clearServerErrorPaths,
  clearServerErrorPrefix,
  localeFromServerPath,
  projectStepIndexForServerPath,
  serverErrorMessage,
  serverErrorPrefixMessage,
} from './project-errors';

describe('project-errors', () => {
  it('reads exact and prefixed server messages', () => {
    const errors = {
      slug: ['bad slug'],
      'meta_keywords.ar.0': ['too long'],
    };
    expect(serverErrorMessage(errors, 'slug')).toBe('bad slug');
    expect(serverErrorPrefixMessage(errors, 'meta_keywords.ar')).toBe('too long');
  });

  it('clears exact paths and prefixes', () => {
    const errors = {
      slug: ['bad'],
      'title.ar': ['required'],
      'meta_keywords.ar.0': ['long'],
    };
    expect(clearServerErrorPaths(errors, ['slug'])).toEqual({
      'title.ar': ['required'],
      'meta_keywords.ar.0': ['long'],
    });
    expect(clearServerErrorPrefix(errors, 'meta_keywords.ar')).toEqual({
      slug: ['bad'],
      'title.ar': ['required'],
    });
  });

  it('maps server paths to locale and wizard steps', () => {
    expect(localeFromServerPath('title.ar')).toBe('ar');
    expect(localeFromServerPath('meta_keywords.en.0')).toBe('en');
    expect(projectStepIndexForServerPath('title.ar')).toBe(0);
    expect(projectStepIndexForServerPath('challenges.0.title.ar')).toBe(1);
    expect(projectStepIndexForServerPath('gallery.0.image')).toBe(2);
    expect(projectStepIndexForServerPath('features.0.title.en')).toBe(3);
    expect(projectStepIndexForServerPath('results.0.value.ar')).toBe(4);
    expect(projectStepIndexForServerPath('identity_items.0.title.ar')).toBe(5);
    expect(projectStepIndexForServerPath('slug')).toBe(6);
  });
});
