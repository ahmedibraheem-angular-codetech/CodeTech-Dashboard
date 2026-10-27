import { forwardRef, inject } from '@angular/core';

import { ServiceEditor } from '../service-editor';

/** Step templates read and update the one editor that owns the draft. */
export abstract class EditorStep {
  protected readonly editor = inject(forwardRef(() => ServiceEditor));
}
