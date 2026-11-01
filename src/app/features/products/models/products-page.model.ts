import type { LocaleText } from './product.model';
import { localeText, productId } from './product.model';

export interface ProductsPageFeature {
  id: string;
  title: LocaleText;
  body: LocaleText;
  icon: string;
  imageName: string;
  imageUrl: string;
}

export interface ProductsPageSector {
  id: string;
  title: LocaleText;
  imageUrl: string;
}

export interface ProductsPageContent {
  featuresEnabled: boolean;
  sectorsEnabled: boolean;
  features: ProductsPageFeature[];
  sectors: ProductsPageSector[];
}

export function productsPageFeature(
  title = localeText(),
  body = localeText(),
  icon = 'pi-star',
): ProductsPageFeature {
  return { id: productId('page-feature'), title, body, icon, imageName: '', imageUrl: '' };
}

export function productsPageSector(title = localeText(), imageUrl = ''): ProductsPageSector {
  return { id: productId('page-sector'), title, imageUrl };
}
