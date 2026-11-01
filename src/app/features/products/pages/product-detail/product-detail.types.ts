
export type ProductDetailRemovable = 'stats' | 'sectors' | 'integrations' | 'units' | 'identity';

export interface ProductDetailRemoveEvent {
  list: ProductDetailRemovable;
  index: number;
}
