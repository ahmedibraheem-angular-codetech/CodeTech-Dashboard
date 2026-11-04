import { blankService, SERVICE_STEPS } from '../models/service.model';
import {
  decideNextStep,
  decidePreviousStep,
  decideSelectStep,
  serviceNamesValid,
  type ServiceEditorNavInput,
} from './service-editor-navigation';

function nav(
  partial: Partial<ServiceEditorNavInput> & Pick<ServiceEditorNavInput, 'draft'>,
): ServiceEditorNavInput {
  return { mode: 'edit', saving: false, step: 0, ...partial };
}

describe('service-editor-navigation', () => {
  it('requires both locale names', () => {
    expect(serviceNamesValid(blankService())).toBe(false);
    expect(serviceNamesValid({ ...blankService(), name: { ar: 'أ', en: 'A' } })).toBe(true);
  });

  it('blocks create jumps ahead and name-gated next', () => {
    expect(decideSelectStep(nav({ mode: 'create', draft: blankService() }), 2)).toEqual({
      kind: 'noop',
    });
    expect(decideNextStep(nav({ mode: 'create', draft: blankService() }))).toEqual({
      kind: 'nameError',
    });
    expect(
      decideNextStep(
        nav({
          mode: 'create',
          draft: { ...blankService(), name: { ar: 'أ', en: 'A' } },
        }),
      ),
    ).toEqual({ kind: 'advance', from: 0 });
  });

  it('handles last step, list exit, and back navigation', () => {
    expect(decideNextStep(nav({ step: SERVICE_STEPS.length - 1, draft: blankService() }))).toEqual({
      kind: 'noop',
    });
    expect(decidePreviousStep(nav({ step: 0, draft: blankService() }))).toEqual({
      kind: 'navigateList',
    });
    expect(decidePreviousStep(nav({ step: 2, draft: blankService() }))).toEqual({
      kind: 'setStep',
      step: 1,
    });
  });
});
