/** Lists that the detail page can shrink via the trash controls. */
export type ProductDetailRemovable = 'stats' | 'sectors' | 'integrations' | 'units' | 'identity';

export interface ProductDetailRemoveEvent {
  list: ProductDetailRemovable;
  index: number;
}
