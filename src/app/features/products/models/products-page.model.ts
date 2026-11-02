import type { AppLanguage } from '../../../core/i18n/language';
import type { LocaleText, ProductImage } from './product.model';
import { emptyProductImage, localeText, productId } from './product.model';

export interface ProductsPageFeature {
  id: string;
  title: LocaleText;
  body: LocaleText;
  /** Legacy PrimeIcon class; prefer uploaded `imageUrl` / `imageUuid`. */
  icon: string;
  imageName: string;
  imageUrl: string;
  imageUuid?: string | null;
}

export interface ProductsPageSector {
  id: string;
  /** Optional label for UI; API sectors are image-only. */
  title: LocaleText;
  image: Record<AppLanguage, ProductImage>;
}

export interface ProductsPageContent {
  featuresEnabled: boolean;
  sectorsEnabled: boolean;
  productsVisible: boolean;
  features: ProductsPageFeature[];
  sectors: ProductsPageSector[];
}

export function productsPageFeature(
  title = localeText(),
  body = localeText(),
  icon = 'pi-star',
): ProductsPageFeature {
  return {
    id: productId('page-feature'),
    title,
    body,
    icon,
    imageName: '',
    imageUrl: '',
    imageUuid: null,
  };
}

export function productsPageSector(title = localeText()): ProductsPageSector {
  return {
    id: productId('page-sector'),
    title,
    image: { ar: emptyProductImage(), en: emptyProductImage() },
  };
}
