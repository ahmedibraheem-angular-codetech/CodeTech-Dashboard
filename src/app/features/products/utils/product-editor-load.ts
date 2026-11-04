import type { Product } from '../models/product.model';
import { blankProduct } from '../models/product.model';

export interface ProductEditorLoadState {
  draft: Product;
  step: number;
  passed: number;
  nameError: boolean;
  status: 'ready';
}

/** Create-mode reset values applied when the editor is not in edit+id. */
export function createModeEditorState(): ProductEditorLoadState {
  return {
    draft: blankProduct(),
    step: 0,
    passed: -1,
    nameError: false,
    status: 'ready',
  };
}

/** Edit-mode success values after `ProductsService.get` returns a product. */
export function editLoadSuccessState(product: Product): ProductEditorLoadState {
  return {
    draft: product,
    step: 0,
    passed: -1,
    nameError: false,
    status: 'ready',
  };
}
