import type { FileObject } from '../../../core/http/api.model';
import type { ProductsPageDto } from '../models/products-page.api';
import {
  mapProductsPage,
  toProductsPageFeatureWrite,
  toProductsPageSectorWrite,
} from './products-page.mapper';

function file(uuid: string, url: string): FileObject {
  return {
    uuid,
    name: 'icon',
    file_name: 'icon.png',
    mime_type: 'image/png',
    size: 10,
    url,
    download_url: url,
    created_at: '2026-01-01T00:00:00.000000Z',
  };
}

const PAGE: ProductsPageDto = {
  sections: {
    why_visible: true,
    sectors_visible: false,
    products_visible: true,
  },
  features: [
    {
      id: 3,
      title: { ar: 'عنوان', en: 'Title' },
      description: { ar: 'وصف', en: 'Body' },
      icon: file('icon-1', 'https://example.test/icon.png'),
    },
  ],
  sectors: [
    {
      id: 9,
      image: {
        ar: file('sec-ar', 'https://example.test/ar.png'),
        en: null,
      },
    },
  ],
};

describe('products-page.mapper', () => {
  it('maps section flags, features, and localized sector images', () => {
    const content = mapProductsPage(PAGE);
    expect(content.featuresEnabled).toBe(true);
    expect(content.sectorsEnabled).toBe(false);
    expect(content.productsVisible).toBe(true);
    expect(content.features).toHaveLength(1);
    expect(content.features[0]).toMatchObject({
      id: '3',
      title: { ar: 'عنوان', en: 'Title' },
      body: { ar: 'وصف', en: 'Body' },
      imageUuid: 'icon-1',
      imageUrl: 'https://example.test/icon.png',
    });
    expect(content.sectors[0]?.id).toBe('9');
    expect(content.sectors[0]?.image.ar.imageUuid).toBe('sec-ar');
    expect(content.sectors[0]?.image.en.imageUuid ?? null).toBeNull();
  });

  it('tolerates missing feature/sector arrays', () => {
    const content = mapProductsPage({
      sections: {
        why_visible: false,
        sectors_visible: false,
        products_visible: false,
      },
      features: undefined as unknown as ProductsPageDto['features'],
      sectors: undefined as unknown as ProductsPageDto['sectors'],
    });
    expect(content.features).toEqual([]);
    expect(content.sectors).toEqual([]);
    expect(content.featuresEnabled).toBe(false);
  });

  it('builds feature write DTOs and clears icon when the image URL is gone', () => {
    const content = mapProductsPage(PAGE);
    const feature = content.features[0]!;
    expect(toProductsPageFeatureWrite(feature)).toEqual({
      title: { ar: 'عنوان', en: 'Title' },
      description: { ar: 'وصف', en: 'Body' },
      icon: 'icon-1',
    });
    expect(
      toProductsPageFeatureWrite({
        ...feature,
        imageUuid: null,
        imageUrl: '',
        title: { ar: '  أ  ', en: '  B  ' },
        body: { ar: '  ج  ', en: '  D  ' },
      }),
    ).toEqual({
      title: { ar: 'أ', en: 'B' },
      description: { ar: 'ج', en: 'D' },
      icon: null,
    });
    expect(
      toProductsPageFeatureWrite({
        ...feature,
        imageUuid: null,
        imageUrl: 'https://example.test/kept.png',
      }),
    ).not.toHaveProperty('icon');
  });

  it('builds sector write DTOs from uuid tickets', () => {
    const content = mapProductsPage(PAGE);
    expect(toProductsPageSectorWrite(content.sectors[0]!)).toEqual({
      image: { ar: 'sec-ar', en: null },
    });
  });
});
