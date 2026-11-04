import { blankService } from '../models/service.model';
import { createModeEditorState, editLoadSuccessState } from './service-editor-load';

describe('service-editor-load', () => {
  it('resets create mode', () => {
    const state = createModeEditorState();
    expect(state).toMatchObject({
      step: 0,
      passed: -1,
      nameError: false,
      status: 'ready',
    });
    expect(state.draft.id).toBe('');
  });

  it('keeps loaded service identity', () => {
    const service = { ...blankService(), id: 'web-development' };
    const state = editLoadSuccessState(service);
    expect(state.draft).toBe(service);
    expect(state.status).toBe('ready');
  });
});
