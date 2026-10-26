import { describe, expect, it } from 'vitest';

import {
  IDENTITY_IMAGE_SLOTS,
  PROJECT_STEPS,
  blankProject,
  localeText,
  projectGalleryImage,
  projectIdentityButton,
  projectMedia,
  projectPoint,
  readLocale,
} from './project.model';

describe('project.model', () => {
  it('exposes seven wizard steps in the required order', () => {
    expect(PROJECT_STEPS.map((step) => step.id)).toEqual([
      'about',
      'challenges',
      'solutions',
      'features',
      'results',
      'identity',
      'seo',
    ]);
  });

  it('builds a blank project with one identity button and four empty image slots', () => {
    const project = blankProject();
    expect(project.id).toBe('');
    expect(project.published).toBe(true);
    expect(project.name).toEqual(localeText());
    expect(project.categories).toHaveLength(1);
    expect(project.aboutCards).toHaveLength(1);
    expect(project.challenges).toHaveLength(1);
    expect(project.tools).toHaveLength(1);
    expect(project.solutions).toHaveLength(1);
    expect(project.gallery).toHaveLength(1);
    expect(project.features).toHaveLength(1);
    expect(project.results).toHaveLength(1);
    expect(project.identityButtons).toHaveLength(1);
    expect(project.identityButtons[0]?.images).toHaveLength(IDENTITY_IMAGE_SLOTS);
    expect(project.identityButtons[0]?.images.every((image) => image.imageUrl === '')).toBe(true);
    expect(project.seo.slug).toEqual(localeText());
  });

  it('keeps Arabic and English locale values independent', () => {
    const value = localeText('عنوان', 'Title');
    expect(readLocale(value, 'ar')).toBe('عنوان');
    expect(readLocale(value, 'en')).toBe('Title');
  });

  it('creates unique nested item ids', () => {
    const ids = [
      projectPoint().id,
      projectMedia().id,
      projectGalleryImage().id,
      projectIdentityButton().id,
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('factory identity buttons always include four image slots', () => {
    const button = projectIdentityButton(localeText('عنوان', 'Title'), localeText('وصف', 'Body'));
    expect(button.title).toEqual(localeText('عنوان', 'Title'));
    expect(button.body).toEqual(localeText('وصف', 'Body'));
    expect(button.images).toHaveLength(IDENTITY_IMAGE_SLOTS);
  });
});
