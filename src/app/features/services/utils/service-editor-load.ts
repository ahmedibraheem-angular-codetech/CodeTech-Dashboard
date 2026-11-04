import type { Service } from '../models/service.model';
import { blankService } from '../models/service.model';
import type { ServicePageStatus } from '../constants/service.constants';

export interface ServiceEditorLoadState {
  draft: Service;
  step: number;
  passed: number;
  nameError: boolean;
  status: Extract<ServicePageStatus, 'ready'>;
}

export function createModeEditorState(): ServiceEditorLoadState {
  return {
    draft: blankService(),
    step: 0,
    passed: -1,
    nameError: false,
    status: 'ready',
  };
}

export function editLoadSuccessState(service: Service): ServiceEditorLoadState {
  return {
    draft: service,
    step: 0,
    passed: -1,
    nameError: false,
    status: 'ready',
  };
}
