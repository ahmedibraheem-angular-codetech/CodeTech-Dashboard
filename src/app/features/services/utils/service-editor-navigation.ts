import { SERVICE_STEPS } from '../models/service.model';
import type { Service } from '../models/service.model';

export type ServiceEditorMode = 'create' | 'edit';

export interface ServiceEditorNavInput {
  mode: ServiceEditorMode;
  saving: boolean;
  step: number;
  draft: Service;
}

export type ServiceEditorNavDecision =
  | { kind: 'noop' }
  | { kind: 'setStep'; step: number }
  | { kind: 'advance'; from: number }
  | { kind: 'nameError' }
  | { kind: 'navigateList' };

export function serviceNamesValid(service: Service): boolean {
  const { name } = service;
  return name.ar.trim().length > 0 && name.en.trim().length > 0;
}

export function decideSelectStep(
  input: ServiceEditorNavInput,
  index: number | undefined,
): ServiceEditorNavDecision {
  if (input.saving || index === undefined || (input.mode === 'create' && index > input.step)) {
    return { kind: 'noop' };
  }
  return { kind: 'setStep', step: index };
}

export function decideNextStep(input: ServiceEditorNavInput): ServiceEditorNavDecision {
  if (input.saving || input.step === SERVICE_STEPS.length - 1) {
    return { kind: 'noop' };
  }
  if (input.mode === 'create' && input.step === 0 && !serviceNamesValid(input.draft)) {
    return { kind: 'nameError' };
  }
  return { kind: 'advance', from: input.step };
}

export function decidePreviousStep(input: ServiceEditorNavInput): ServiceEditorNavDecision {
  if (input.saving) {
    return { kind: 'noop' };
  }
  if (input.step === 0) {
    return { kind: 'navigateList' };
  }
  return { kind: 'setStep', step: input.step - 1 };
}
