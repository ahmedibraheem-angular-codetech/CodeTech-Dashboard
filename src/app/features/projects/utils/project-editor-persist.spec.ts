import { SEO_STEP_INDEX } from '../constants/project-steps';
import { blankProject, type Project } from '../models/project.model';
import {
  evaluateProjectPersist,
  invalidSummaryLocale,
  projectSummaryLocalesValid,
  resolveServerErrorFocus,
} from './project-editor-persist';

function draft(patch: (project: Project) => void): Project {
  const project = blankProject();
  patch(project);
  return project;
}

describe('project-editor-persist', () => {
  it('returns busy while saving or before the editor is ready', () => {
    expect(
      evaluateProjectPersist(blankProject(), false, { saving: true, status: 'ready' }),
    ).toEqual({ kind: 'busy' });
    expect(
      evaluateProjectPersist(blankProject(), false, { saving: false, status: 'loading' }),
    ).toEqual({ kind: 'busy' });
  });

  it('blocks publish when either name locale is empty', () => {
    expect(
      evaluateProjectPersist(blankProject(), true, { saving: false, status: 'ready' }),
    ).toEqual({ kind: 'nameError', step: 0 });
  });

  it('allows draft save without names but still validates summary length', () => {
    const long = draft((project) => {
      project.summary = { ar: 'x'.repeat(301), en: 'ok' };
    });
    expect(projectSummaryLocalesValid(long)).toBe(false);
    expect(invalidSummaryLocale(long)).toBe('ar');
    expect(evaluateProjectPersist(long, false, { saving: false, status: 'ready' })).toEqual({
      kind: 'summaryInvalid',
      step: 0,
      locale: 'ar',
    });
  });

  it('blocks on the first repeater issue before SEO', () => {
    const project = draft((item) => {
      item.name = { ar: 'أ', en: 'A' };
      item.categories[0] = {
        ...item.categories[0],
        id: 'local-category',
        title: { ar: '', en: 'Only EN' },
        body: { ar: 'نص', en: 'Body' },
      };
    });
    expect(evaluateProjectPersist(project, true, { saving: false, status: 'ready' })).toEqual({
      kind: 'repeaterInvalid',
      step: 0,
      preferAr: true,
    });
  });

  it('blocks on SEO after earlier gates pass', () => {
    const project = draft((item) => {
      item.name = { ar: 'أ', en: 'A' };
      item.seo.slug = { ar: 'Bad Slug', en: 'ok' };
    });
    expect(evaluateProjectPersist(project, true, { saving: false, status: 'ready' })).toEqual({
      kind: 'seoInvalid',
      step: SEO_STEP_INDEX,
      locale: 'ar',
    });
  });

  it('returns a ready project with the requested published flag', () => {
    const project = draft((item) => {
      item.name = { ar: 'أ', en: 'A' };
      item.id = 'wasly';
    });
    expect(evaluateProjectPersist(project, true, { saving: false, status: 'ready' })).toEqual({
      kind: 'ready',
      project: { ...project, published: true },
    });
  });

  it('maps the first server error path to locale and step', () => {
    expect(resolveServerErrorFocus({})).toEqual({ language: null, stepIndex: -1 });
    expect(resolveServerErrorFocus({ slug: ['taken'] })).toEqual({
      language: null,
      stepIndex: SEO_STEP_INDEX,
    });
    expect(resolveServerErrorFocus({ 'title.ar': ['required'], slug: ['taken'] })).toEqual({
      language: 'ar',
      stepIndex: 0,
    });
  });
});
