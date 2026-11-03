import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, forkJoin, from, map, of, switchMap } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import type { ApiEnvelope } from '../../../core/http/api.model';
import { MediaService } from '../../../core/media/media.service';
import type {
  ProductsPageDto,
  ProductsPageFeatureDto,
  ProductsPageSectionsWriteDto,
  ProductsPageSectorDto,
} from '../models/products-page.api';
import type {
  ProductsPageContent,
  ProductsPageFeature,
  ProductsPageSector,
} from '../models/products-page.model';
import { isUploadUrl } from './product.mapper';
import {
  mapProductsPage,
  toProductsPageFeatureWrite,
  toProductsPageSectorWrite,
} from './products-page.mapper';

const PAGE_PATH = 'admin/pages/products';
const FEATURES_PATH = 'admin/products-page/features';
const SECTORS_PATH = 'admin/products-page/sectors';

/**
 * Products marketing page manager.
 * Section switches: PATCH /admin/pages/products/sections.
 * Features/sectors: CRUD under /admin/products-page/*.
 */
@Injectable({ providedIn: 'root' })
export class ProductsPageService {
  private readonly http = inject(HttpClient);
  private readonly media = inject(MediaService);
  private readonly base = inject(API_BASE_URL);

  get(): Observable<ProductsPageContent> {
    return this.http
      .get<ApiEnvelope<ProductsPageDto>>(apiUrl(this.base, PAGE_PATH))
      .pipe(map((envelope) => mapProductsPage(this.requirePage(envelope))));
  }

  toggleFeatures(enabled: boolean): Observable<ProductsPageContent> {
    return this.patchSections({ features_enabled: enabled });
  }

  toggleSectors(enabled: boolean): Observable<ProductsPageContent> {
    return this.patchSections({ sectors_enabled: enabled });
  }

  toggleProductsVisible(visible: boolean): Observable<ProductsPageContent> {
    return this.patchSections({ products_visible: visible });
  }

  saveFeature(feature: ProductsPageFeature): Observable<ProductsPageFeature> {
    return this.uploadFeatureIcon(feature).pipe(
      switchMap((prepared) => {
        const body = toProductsPageFeatureWrite(prepared);
        if (!prepared.id || !/^\d+$/.test(prepared.id)) {
          return this.http.post<ApiEnvelope<ProductsPageFeatureDto>>(
            apiUrl(this.base, FEATURES_PATH),
            body,
          );
        }
        return this.http.put<ApiEnvelope<ProductsPageFeatureDto>>(
          apiUrl(this.base, `${FEATURES_PATH}/${prepared.id}`),
          body,
        );
      }),
      map((envelope) => {
        const mapped = mapProductsPage({
          sections: { features_enabled: true, sectors_enabled: true, products_visible: true },
          features: [this.requireFeature(envelope)],
          sectors: [],
        });
        return mapped.features[0]!;
      }),
    );
  }

  removeFeature(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${FEATURES_PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  saveSector(sector: ProductsPageSector): Observable<ProductsPageSector> {
    return this.uploadSectorImages(sector).pipe(
      switchMap((prepared) => {
        const body = toProductsPageSectorWrite(prepared);
        if (!prepared.id || !/^\d+$/.test(prepared.id)) {
          return this.http.post<ApiEnvelope<ProductsPageSectorDto>>(
            apiUrl(this.base, SECTORS_PATH),
            body,
          );
        }
        return this.http.put<ApiEnvelope<ProductsPageSectorDto>>(
          apiUrl(this.base, `${SECTORS_PATH}/${prepared.id}`),
          body,
        );
      }),
      map((envelope) => {
        const mapped = mapProductsPage({
          sections: { features_enabled: true, sectors_enabled: true, products_visible: true },
          features: [],
          sectors: [this.requireSector(envelope)],
        });
        return mapped.sectors[0]!;
      }),
    );
  }

  removeSector(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${SECTORS_PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  private patchSections(body: ProductsPageSectionsWriteDto): Observable<ProductsPageContent> {
    return this.http
      .patch<ApiEnvelope<ProductsPageDto>>(apiUrl(this.base, `${PAGE_PATH}/sections`), body)
      .pipe(map((envelope) => mapProductsPage(this.requirePage(envelope))));
  }

  private uploadFeatureIcon(feature: ProductsPageFeature): Observable<ProductsPageFeature> {
    if (!isUploadUrl(feature.imageUrl)) {
      return of(feature);
    }
    return fromBlob(feature.imageUrl, feature.imageName || 'icon.png').pipe(
      switchMap((file) => this.media.upload('image', file)),
      map((uploaded) => ({
        ...feature,
        imageUuid: uploaded.uuid,
        imageUrl: uploaded.url,
        imageName: uploaded.file_name || uploaded.name || feature.imageName,
      })),
    );
  }

  private uploadSectorImages(sector: ProductsPageSector): Observable<ProductsPageSector> {
    return forkJoin({
      ar: this.uploadImage(sector.image.ar.imageUrl, sector.image.ar.imageName, sector.image.ar.imageUuid),
      en: this.uploadImage(sector.image.en.imageUrl, sector.image.en.imageName, sector.image.en.imageUuid),
    }).pipe(map((image) => ({ ...sector, image })));
  }

  private uploadImage(
    url: string,
    name: string,
    uuid: string | null | undefined,
  ): Observable<{ imageName: string; imageUrl: string; imageUuid: string | null }> {
    if (!isUploadUrl(url)) {
      return of({ imageName: name, imageUrl: url, imageUuid: uuid ?? null });
    }
    return fromBlob(url, name || 'sector.png').pipe(
      switchMap((file) => this.media.upload('image', file)),
      map((uploaded) => ({
        imageUuid: uploaded.uuid,
        imageUrl: uploaded.url,
        imageName: uploaded.file_name || uploaded.name || name,
      })),
    );
  }

  private requirePage(envelope: ApiEnvelope<ProductsPageDto>): ProductsPageDto {
    const data = envelope?.data;
    if (!data?.sections) {
      throw new Error('Invalid products page response');
    }
    return data;
  }

  private requireFeature(envelope: ApiEnvelope<ProductsPageFeatureDto>): ProductsPageFeatureDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid products page feature response');
    }
    return data;
  }

  private requireSector(envelope: ApiEnvelope<ProductsPageSectorDto>): ProductsPageSectorDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid products page sector response');
    }
    return data;
  }
}

function fromBlob(url: string, name: string) {
  return from(
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => new File([blob], name || 'image.png', { type: blob.type || 'image/png' })),
  );
}
