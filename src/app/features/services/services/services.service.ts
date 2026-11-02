import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  type Observable,
  catchError,
  forkJoin,
  from,
  map,
  of,
  switchMap,
  throwError,
} from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import { statusOf } from '../../../core/http/api-error';
import type { ApiEnvelope } from '../../../core/http/api.model';
import { MediaService } from '../../../core/media/media.service';
import type {
  ServiceDetailDto,
  ServiceLinkedProjectDto,
  ServiceListDto,
  ServiceListName,
  ServiceStatusWriteDto,
} from '../models/service.api';
import type { Service, ServiceImage, ServiceSector } from '../models/service.model';
import {
  isUploadUrl,
  mapServiceDetail,
  mapServiceListItem,
  toServiceWrite,
} from './service.mapper';

const PATH = 'admin/services';

/**
 * Catalog services. List is a non-paginated array in website order.
 * Nested needs/solutions/stages/features/sectors/faqs are embedded on write;
 * FAQs are embedded (not referenced from Help Center).
 * Media uses coat-check UUIDs; omit keeps, null clears. PrimeIcon `icon:pi-*`
 * URLs are UI-only and are never sent as media tickets.
 */
@Injectable({ providedIn: 'root' })
export class ServicesService {
  private readonly http = inject(HttpClient);
  private readonly media = inject(MediaService);
  private readonly base = inject(API_BASE_URL);

  list(): Observable<Service[]> {
    return this.http
      .get<ApiEnvelope<ServiceListDto[]>>(apiUrl(this.base, PATH))
      .pipe(map((envelope) => this.requireList(envelope).map(mapServiceListItem)));
  }

  get(id: string): Observable<Service | null> {
    return this.http.get<ApiEnvelope<ServiceDetailDto>>(apiUrl(this.base, `${PATH}/${id}`)).pipe(
      map((envelope) => mapServiceDetail(this.requireDetail(envelope))),
      catchError((error: unknown) => {
        if (statusOf(error) === 404) {
          return of(null);
        }
        return throwError(() => error);
      }),
    );
  }

  save(service: Service): Observable<Service> {
    return this.prepareUploads(service).pipe(
      switchMap((prepared) => {
        const body = toServiceWrite(prepared);
        if (!prepared.id) {
          return this.http.post<ApiEnvelope<ServiceDetailDto>>(apiUrl(this.base, PATH), body);
        }
        return this.http.put<ApiEnvelope<ServiceDetailDto>>(
          apiUrl(this.base, `${PATH}/${prepared.id}`),
          body,
        );
      }),
      map((envelope) => mapServiceDetail(this.requireDetail(envelope))),
    );
  }

  setPublished(id: string, published: boolean): Observable<Service> {
    const body: ServiceStatusWriteDto = { status: published ? 'published' : 'draft' };
    return this.http
      .patch<ApiEnvelope<ServiceDetailDto>>(apiUrl(this.base, `${PATH}/${id}/status`), body)
      .pipe(map((envelope) => mapServiceDetail(this.requireDetail(envelope))));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  removeListItem(serviceId: string, list: ServiceListName, itemId: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${PATH}/${serviceId}/${list}/${itemId}`), {
        responseType: 'text',
      })
      .pipe(map(() => undefined));
  }

  setProjectVisible(
    serviceId: string,
    projectId: string,
    visible: boolean,
  ): Observable<ServiceLinkedProjectDto> {
    return this.http
      .patch<ApiEnvelope<ServiceLinkedProjectDto>>(
        apiUrl(this.base, `${PATH}/${serviceId}/projects/${projectId}`),
        { is_visible: visible },
      )
      .pipe(map((envelope) => this.requireLinkedProject(envelope)));
  }

  reorder(ids: readonly string[]): Observable<void> {
    return this.http
      .post(
        apiUrl(this.base, `${PATH}/reorder`),
        { ids: ids.map((id) => Number(id)).filter((id) => Number.isFinite(id)) },
        { responseType: 'text' },
      )
      .pipe(map(() => undefined));
  }

  private prepareUploads(service: Service): Observable<Service> {
    const next = structuredClone(service);
    return forkJoin({
      icon: this.uploadSlot(
        {
          imageUrl: next.iconUrl,
          imageName: 'icon.png',
          imageUuid: next.iconUuid,
        },
        true,
      ),
      whyImage: this.uploadSlot(next.whyImage),
      whyItems: this.uploadSlots(next.whyItems),
      solutions: this.uploadSlots(next.solutions),
      stages: this.uploadSlots(next.stages),
      features: this.uploadSlots(next.features),
      sectors: this.uploadSectors(next.sectors),
    }).pipe(
      map((uploaded) => ({
        ...next,
        iconUrl: uploaded.icon.imageUrl,
        iconUuid: uploaded.icon.imageUuid ?? null,
        whyImage: { ...next.whyImage, ...uploaded.whyImage },
        whyItems: next.whyItems.map((item, index) => ({ ...item, ...uploaded.whyItems[index] })),
        solutions: next.solutions.map((item, index) => ({
          ...item,
          ...uploaded.solutions[index],
        })),
        stages: next.stages.map((item, index) => ({ ...item, ...uploaded.stages[index] })),
        features: next.features.map((item, index) => ({ ...item, ...uploaded.features[index] })),
        sectors: uploaded.sectors,
      })),
    );
  }

  private uploadSlots(items: readonly ServiceImage[]): Observable<ServiceImage[]> {
    if (items.length === 0) {
      return of([]);
    }
    return forkJoin(items.map((item) => this.uploadSlot(item)));
  }

  private uploadSectors(items: readonly ServiceSector[]): Observable<ServiceSector[]> {
    if (items.length === 0) {
      return of([]);
    }
    return forkJoin(
      items.map((sector) =>
        forkJoin({
          ar: this.uploadSlot(sector.image.ar),
          en: this.uploadSlot(sector.image.en),
        }).pipe(map((image) => ({ ...sector, image }))),
      ),
    );
  }

  private uploadSlot(image: ServiceImage, allowEmpty = false): Observable<ServiceImage> {
    if (!isUploadUrl(image.imageUrl)) {
      return of(image);
    }
    return from(this.blobToFile(image.imageUrl, image.imageName || 'image.png')).pipe(
      switchMap((file) => this.media.upload('image', file)),
      map((uploaded) => ({
        imageUuid: uploaded.uuid,
        imageUrl: uploaded.url,
        imageName: uploaded.file_name || uploaded.name || image.imageName || 'image.png',
      })),
      catchError((error: unknown) => {
        if (allowEmpty) {
          return of(image);
        }
        return throwError(() => error);
      }),
    );
  }

  private async blobToFile(url: string, name: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], name || 'image.png', { type: blob.type || 'image/png' });
  }

  private requireList(envelope: ApiEnvelope<ServiceListDto[]>): ServiceListDto[] {
    return Array.isArray(envelope?.data) ? envelope.data : [];
  }

  private requireDetail(envelope: ApiEnvelope<ServiceDetailDto>): ServiceDetailDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid service response');
    }
    return data;
  }

  private requireLinkedProject(
    envelope: ApiEnvelope<ServiceLinkedProjectDto>,
  ): ServiceLinkedProjectDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid linked project response');
    }
    return data;
  }
}
