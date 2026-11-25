import { forwardRef, inject } from '@angular/core';

import { ProjectEditor } from '../project-editor';

export const PROJECT_EDITOR_STEP_HOST = { style: 'display: contents' };

export abstract class EditorStep {
  protected readonly editor = inject(forwardRef(() => ProjectEditor));
}
