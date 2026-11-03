import { describe, expect, it } from 'vitest';

import { blankProject, localeText, projectIdentityButton, projectPoint } from '../models/project.model';
import {
  firstRepeaterValidationIssue,
  isNewIdentityTitleValid,
  isNewPointTitleBodyValid,
  projectRepeatersValid,
} from './project-repeater-validation';

describe('project-repeater-validation', () => {
  it('skips empty and server rows, and requires Arabic title+body for new contentful points', () => {
    expect(isNewPointTitleBodyValid(projectPoint())).toBe(true);
    expect(
      isNewPointTitleBodyValid({
        ...projectPoint(localeText('', 'Title'), localeText('', 'Body')),
        id: '1',
      }),
    ).toBe(true);
    expect(
      isNewPointTitleBodyValid(projectPoint(localeText('', 'Title'), localeText('', 'Body'))),
    ).toBe(false);
    expect(
      isNewPointTitleBodyValid(projectPoint(localeText('عنوان', 'Title'), localeText('وصف', 'Body'))),
    ).toBe(true);
  });

  it('requires Arabic title for new identity buttons with content', () => {
    expect(isNewIdentityTitleValid(projectIdentityButton())).toBe(true);
    expect(
      isNewIdentityTitleValid(projectIdentityButton(localeText('', 'Title'), localeText())),
    ).toBe(false);
    expect(
      isNewIdentityTitleValid({
        ...projectIdentityButton(localeText('', 'Title'), localeText()),
        id: '9',
      }),
    ).toBe(true);
  });

  it('reports the first failing step in wizard order', () => {
    const project = blankProject();
    project.features = [projectPoint(localeText('', 'Feature'), localeText('', 'Body'))];
    expect(firstRepeaterValidationIssue(project)).toEqual({ step: 3, preferAr: true });
    expect(projectRepeatersValid(project)).toBe(false);
  });
});
