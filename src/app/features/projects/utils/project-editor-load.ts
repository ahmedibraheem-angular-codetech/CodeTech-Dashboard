import type { FieldErrors } from '../../../core/http/api-error';
import type { Project } from '../models/project.model';
import { blankProject } from '../models/project.model';

export interface ProjectEditorLoadState {
  draft: Project;
  step: number;
  passed: number;
  nameError: boolean;
  status: 'ready';
  /** Projects clear field errors on create reset and successful edit load. */
  serverErrors: FieldErrors;
}

/** Create-mode reset values applied when the editor is not in edit+id. */
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

/** Edit-mode success values after `ProjectsService.get` returns a project. */
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
