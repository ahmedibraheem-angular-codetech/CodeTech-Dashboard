import type { FieldErrors } from '../../../core/http/api-error';
import type { Project } from '../models/project.model';
import { blankProject } from '../models/project.model';

export interface ProjectEditorLoadState {
  draft: Project;
  step: number;
  passed: number;
  nameError: boolean;
  status: 'ready';
  serverErrors: FieldErrors;
}

export function createModeEditorState(): ProjectEditorLoadState {
  return {
    draft: blankProject(),
    step: 0,
    passed: -1,
    nameError: false,
    status: 'ready',
    serverErrors: {},
  };
}

export function editLoadSuccessState(project: Project): ProjectEditorLoadState {
  return {
    draft: project,
    step: 0,
    passed: -1,
    nameError: false,
    status: 'ready',
    serverErrors: {},
  };
}
