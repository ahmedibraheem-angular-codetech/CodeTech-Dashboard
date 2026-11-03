import { emptyLocalizedMedia, emptyProductImage, productSector } from './product.model';
import {
  isSectorArabicImageValid,
  sectorHasAnyMedia,
  sectorHasArabicImage,
} from './product-sector-media';

function withImage(
  locale: 'ar' | 'en',
  image: { imageUrl: string; imageUuid?: string | null; imageName?: string },
) {
  const sector = productSector();
  return {
    ...sector,
    image: {
      ...emptyLocalizedMedia(),
      [locale]: {
        imageName: image.imageName ?? 'sector.png',
        imageUrl: image.imageUrl,
        imageUuid: image.imageUuid ?? null,
      },
    },
  };
}

describe('product sector media validation', () => {
  it('treats a completely empty sector as optional (not payload-included)', () => {
    const sector = productSector();
    expect(sectorHasAnyMedia(sector)).toBe(false);
    expect(isSectorArabicImageValid(sector)).toBe(true);
  });

  it('accepts a new sector with an Arabic image', () => {
    const sector = withImage('ar', { imageUrl: 'blob:sector/1', imageUuid: null });
    expect(sectorHasAnyMedia(sector)).toBe(true);
    expect(sectorHasArabicImage(sector)).toBe(true);
    expect(isSectorArabicImageValid(sector)).toBe(true);
  });

  it('rejects a new sector with an English-only image', () => {
    const sector = withImage('en', { imageUrl: 'blob:sector/en', imageUuid: null });
    expect(sectorHasAnyMedia(sector)).toBe(true);
    expect(sectorHasArabicImage(sector)).toBe(false);
    expect(isSectorArabicImageValid(sector)).toBe(false);
  });

  it('accepts an existing sector with an Arabic remote image without re-upload', () => {
    const sector = {
      ...productSector(),
      id: '31',
      image: {
        ar: {
          imageName: 'sector.png',
          imageUrl: 'https://cdn.example/sec-ar.png',
          imageUuid: 'sec-ar',
        },
        en: emptyProductImage(),
      },
    };
    expect(isSectorArabicImageValid(sector)).toBe(true);
  });

  it('rejects an existing English-only sector when it would be included in the payload', () => {
    const sector = {
      ...withImage('en', {
        imageUrl: 'https://cdn.example/sec-en.png',
        imageUuid: 'sec-en',
      }),
      id: '31',
    };
    expect(sectorHasAnyMedia(sector)).toBe(true);
    expect(isSectorArabicImageValid(sector)).toBe(false);
  });
});
