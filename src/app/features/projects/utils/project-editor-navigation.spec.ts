import { PROJECT_STEPS, SEO_STEP_INDEX } from '../constants/project-steps';
import { blankProject, type Project } from '../models/project.model';
import {
  canLeaveProjectEditorStep,
  decideNextStep,
  decidePreviousStep,
  decideSelectStep,
  invalidSeoLocale,
  projectSeoStepValid,
  type ProjectEditorNavInput,
} from './project-editor-navigation';

function draft(patch: (project: Project) => void): Project {
  const project = blankProject();
  patch(project);
  return project;
}

function nav(
  partial: Partial<ProjectEditorNavInput> & Pick<ProjectEditorNavInput, 'draft'>,
): ProjectEditorNavInput {
  return {
    mode: 'edit',
    saving: false,
    step: 0,
    ...partial,
  };
}

describe('project-editor-navigation', () => {
  it('blocks create select past the current step and allows edit jumps when leave gates pass', () => {
    const project = draft((item) => {
      item.name = { ar: 'أ', en: 'A' };
    });
    expect(decideSelectStep(nav({ mode: 'create', step: 0, draft: project }), 2)).toEqual({
      kind: 'noop',
    });
    expect(decideSelectStep(nav({ mode: 'edit', step: 0, draft: project }), 2)).toEqual({
      kind: 'setStep',
      step: 2,
    });
  });

  it('blocks next on create until both names are set', () => {
    expect(decideNextStep(nav({ mode: 'create', step: 0, draft: blankProject() }))).toEqual({
      kind: 'nameError',
    });
    const named = draft((project) => {
      project.name = { ar: 'أ', en: 'A' };
    });
    expect(decideNextStep(nav({ mode: 'create', step: 0, draft: named }))).toEqual({
      kind: 'advance',
      from: 0,
    });
  });

  it('does not advance from the last step and navigates to the list from step 0', () => {
    expect(decideNextStep(nav({ step: PROJECT_STEPS.length - 1, draft: blankProject() }))).toEqual({
      kind: 'noop',
    });
    expect(decidePreviousStep(nav({ step: 0, draft: blankProject() }))).toEqual({
      kind: 'navigateList',
    });
    expect(decidePreviousStep(nav({ step: 2, draft: blankProject() }))).toEqual({
      kind: 'setStep',
      step: 1,
    });
  });

  it('does not gate identity leave (unlike products) but blocks SEO leave when invalid', () => {
    const identityIndex = PROJECT_STEPS.findIndex((step) => step.id === 'identity');
    expect(canLeaveProjectEditorStep(identityIndex, identityIndex + 1, blankProject())).toEqual({
      ok: true,
    });

    const badSlug = draft((item) => {
      item.seo.slug = { ar: 'Bad Slug', en: 'ok-slug' };
    });
    expect(projectSeoStepValid(badSlug)).toBe(false);
    expect(invalidSeoLocale(badSlug)).toBe('ar');
    expect(canLeaveProjectEditorStep(SEO_STEP_INDEX, SEO_STEP_INDEX - 1, badSlug)).toEqual({
      ok: false,
      locale: 'ar',
    });
    expect(decidePreviousStep(nav({ step: SEO_STEP_INDEX, draft: badSlug }))).toEqual({
      kind: 'blocked',
      locale: 'ar',
    });
  });
});
