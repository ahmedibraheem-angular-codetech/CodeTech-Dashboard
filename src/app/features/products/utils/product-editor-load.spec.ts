import { blankProduct } from '../models/product.model';
import { createModeEditorState, editLoadSuccessState } from './product-editor-load';

describe('product-editor-load', () => {
  it('resets create mode to a blank ready draft at step 0', () => {
    const state = createModeEditorState();
    expect(state).toMatchObject({
      step: 0,
      passed: -1,
      nameError: false,
      status: 'ready',
    });
    expect(state.draft.id).toBe('');
    expect(state.draft.name).toEqual({ ar: '', en: '' });
    expect(state.draft.published).toBe(true);
    expect(state.draft.features).toHaveLength(1);
  });

  it('applies a loaded product without changing the entity identity', () => {
    const product = { ...blankProduct(), id: 'info-system', name: { ar: 'أ', en: 'A' } };
    const state = editLoadSuccessState(product);
    expect(state.draft).toBe(product);
    expect(state).toMatchObject({
      step: 0,
      passed: -1,
      nameError: false,
      status: 'ready',
    });
  });
});
