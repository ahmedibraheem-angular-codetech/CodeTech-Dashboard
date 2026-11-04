import { blankProject } from '../models/project.model';
import { createModeEditorState, editLoadSuccessState } from './project-editor-load';

describe('project-editor-load', () => {
  it('resets create mode to a blank ready draft and clears server errors', () => {
    const state = createModeEditorState();
    expect(state).toMatchObject({
      step: 0,
      passed: -1,
      nameError: false,
      status: 'ready',
      serverErrors: {},
    });
    expect(state.draft.id).toBe('');
    expect(state.draft.name).toEqual({ ar: '', en: '' });
  });

  it('applies a loaded project and clears server errors', () => {
    const project = { ...blankProject(), id: 'wasly', name: { ar: 'أ', en: 'A' } };
    const state = editLoadSuccessState(project);
    expect(state.draft).toBe(project);
    expect(state).toMatchObject({
      step: 0,
      passed: -1,
      nameError: false,
      status: 'ready',
      serverErrors: {},
    });
  });
});
