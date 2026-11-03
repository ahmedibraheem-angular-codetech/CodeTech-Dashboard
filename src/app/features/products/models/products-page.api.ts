import type { FileObject } from '../../../core/http/api.model';
import type { ProductLocaleDto } from './product.api';

/** Products marketing page (GET /admin/pages/products). */
export interface ProductsPageSectionsDto {
  why_visible: boolean;
  sectors_visible: boolean;
  products_visible: boolean;
}

export interface ProductsPageFeatureDto {
  id: number;
  title: ProductLocaleDto;
  description: ProductLocaleDto;
  icon: FileObject | null;
  sort_order?: number;
}

export interface ProductsPageSectorDto {
  id: number;
  image: { ar: FileObject | null; en: FileObject | null };
  sort_order?: number;
}

export interface ProductsPageDto {
  sections: ProductsPageSectionsDto;
  features: ProductsPageFeatureDto[];
  sectors: ProductsPageSectorDto[];
}

export interface ProductsPageSectionsWriteDto {
  why_visible?: boolean;
  sectors_visible?: boolean;
  products_visible?: boolean;
}

export interface ProductsPageFeatureWriteDto {
  title: { ar: string; en?: string };
  description?: { ar: string; en?: string };
  icon?: string | null;
}

export interface ProductsPageSectorWriteDto {
  image: { ar: string | null; en?: string | null };
}
