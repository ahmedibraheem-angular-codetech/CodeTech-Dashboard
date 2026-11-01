import { forwardRef, inject } from '@angular/core';

import { ProjectEditor } from '../project-editor';

export abstract class EditorStep {
  protected readonly editor = inject(forwardRef(() => ProjectEditor));
}
