import { forwardRef, inject } from '@angular/core';

import { ProductEditor } from '../product-editor';

export abstract class EditorStep {
  protected readonly editor = inject(forwardRef(() => ProductEditor));
}
