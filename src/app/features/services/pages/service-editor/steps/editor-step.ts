import { forwardRef, inject } from '@angular/core';

import { ServiceEditor } from '../service-editor';

export abstract class EditorStep {
  protected readonly editor = inject(forwardRef(() => ServiceEditor));
}
