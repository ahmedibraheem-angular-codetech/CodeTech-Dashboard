import type {
  ProductsPageDto,
  ProductsPageFeatureDto,
  ProductsPageFeatureWriteDto,
  ProductsPageSectorDto,
  ProductsPageSectorWriteDto,
} from '../models/product.api';
import { localeText, type LocaleText } from '../models/product.model';
import type {
  ProductsPageContent,
  ProductsPageFeature,
  ProductsPageSector,
} from '../models/products-page.model';
import { mapProductMedia } from './product.mapper';

function locale(value: { ar: string | null; en: string | null } | null | undefined): LocaleText {
  return localeText(
    typeof value?.ar === 'string' ? value.ar : '',
    typeof value?.en === 'string' ? value.en : '',
  );
}

export function mapProductsPage(dto: ProductsPageDto): ProductsPageContent {
  return {
    featuresEnabled: !!dto.sections?.features_enabled,
    sectorsEnabled: !!dto.sections?.sectors_enabled,
    productsVisible: !!dto.sections?.products_visible,
    features: (dto.features ?? []).map(mapFeature),
    sectors: (dto.sectors ?? []).map(mapSector),
  };
}

function mapFeature(dto: ProductsPageFeatureDto): ProductsPageFeature {
  const icon = mapProductMedia(dto.icon);
  return {
    id: String(dto.id),
    title: locale(dto.title),
    body: locale(dto.description),
    icon: '',
    imageName: icon.imageName,
    imageUrl: icon.imageUrl,
    imageUuid: icon.imageUuid ?? null,
  };
}

function mapSector(dto: ProductsPageSectorDto): ProductsPageSector {
  const ar = mapProductMedia(dto.image?.ar ?? null);
  const en = mapProductMedia(dto.image?.en ?? null);
  return {
    id: String(dto.id),
    title: localeText(),
    image: { ar, en },
  };
}

export function toProductsPageFeatureWrite(
  feature: ProductsPageFeature,
): ProductsPageFeatureWriteDto {
  const body: ProductsPageFeatureWriteDto = {
    title: { ar: feature.title.ar.trim(), en: feature.title.en.trim() },
    description: { ar: feature.body.ar.trim(), en: feature.body.en.trim() },
  };
  if (feature.imageUuid) {
    body.icon = feature.imageUuid;
  } else if (!feature.imageUrl) {
    body.icon = null;
  }
  return body;
}

export function toProductsPageSectorWrite(sector: ProductsPageSector): ProductsPageSectorWriteDto {
  return {
    image: {
      ar: sector.image.ar.imageUuid ?? null,
      en: sector.image.en.imageUuid ?? null,
    },
  };
}
