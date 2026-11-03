import type { ProductSector } from './product.model';

/** Matches `toProductWrite` inclusion: any locale with an image URL. */
export function sectorHasAnyMedia(sector: ProductSector): boolean {
  return !!(sector.image.ar.imageUrl || sector.image.en.imageUrl);
}

/** Arabic image available (remote UUID URL or local blob preview). */
export function sectorHasArabicImage(sector: ProductSector): boolean {
  return !!sector.image.ar.imageUrl;
}

/**
 * Empty sectors (excluded from payload) are valid.
 * Payload-included sectors require an Arabic image; English alone is not enough.
 */
export function isSectorArabicImageValid(sector: ProductSector): boolean {
  return !sectorHasAnyMedia(sector) || sectorHasArabicImage(sector);
}
