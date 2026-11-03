import { forwardRef, inject } from '@angular/core';

import { ProductEditor } from '../product-editor';

/** Shared host binding so step roots do not add layout wrappers. */
export const PRODUCT_EDITOR_STEP_HOST = { style: 'display: contents' };

export abstract class EditorStep {
  protected readonly editor = inject(forwardRef(() => ProductEditor));
}
