import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map, of, switchMap, throwError } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import type { ApiEnvelope } from '../../../core/http/api.model';
import { MediaService } from '../../../core/media/media.service';
import type {
  HomePageDto,
  HomePartnerDto,
  PartnerCreateDto,
} from '../models/homepage.api';
import type { BlockImage, ContentBlock, HomepageContent, Partner } from '../models/homepage.model';
import { mapHomePage, mapPartner, toBlockWrite } from './homepage.mapper';

const HOME_PATH = 'admin/pages/home';
const PARTNERS_PATH = 'admin/partners';

@Injectable({ providedIn: 'root' })
export class HomepageService {
  private readonly http = inject(HttpClient);
  private readonly media = inject(MediaService);
  private readonly base = inject(API_BASE_URL);

  load(): Observable<HomepageContent> {
    return this.http
      .get<ApiEnvelope<HomePageDto>>(apiUrl(this.base, HOME_PATH))
      .pipe(map((envelope) => mapHomePage(this.requireHome(envelope))));
  }

  savePartner(partner: Partner): Observable<Partner> {
    const file = partner.image?.file;
    if (!file) {
      return throwError(() => new Error('Partner logo file is required'));
    }
    return this.media.upload('image', file).pipe(
      switchMap((uploaded) => {
        const body: PartnerCreateDto = { logo: uploaded.uuid };
        return this.http.post<ApiEnvelope<HomePartnerDto>>(
          apiUrl(this.base, PARTNERS_PATH),
          body,
        );
      }),
      map((envelope) => mapPartner(this.requirePartner(envelope))),
    );
  }

  removePartner(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${PARTNERS_PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  setVideoEnabled(enabled: boolean): Observable<HomepageContent> {
    return this.http
      .put<ApiEnvelope<HomePageDto>>(apiUrl(this.base, `${HOME_PATH}/intro-video`), {
        is_visible: enabled,
      })
      .pipe(map((envelope) => mapHomePage(this.requireHome(envelope))));
  }

  setVideo(file: File): Observable<HomepageContent> {
    return this.media.upload('video', file).pipe(
      switchMap((uploaded) =>
        this.http.put<ApiEnvelope<HomePageDto>>(
          apiUrl(this.base, `${HOME_PATH}/intro-video`),
          { video: uploaded.uuid },
        ),
      ),
      map((envelope) => mapHomePage(this.requireHome(envelope))),
    );
  }

  removeVideo(): Observable<HomepageContent> {
    return this.http
      .delete<ApiEnvelope<HomePageDto>>(apiUrl(this.base, `${HOME_PATH}/intro-video`))
      .pipe(map((envelope) => mapHomePage(this.requireHome(envelope))));
  }

  /**
   * Saves about or Vision 2030. Image coat-check:
   * - new File → upload then send uuid
   * - null → send null (remove)
   * - existing uuid → omit the field (keep)
   */
  saveBlock(
    kind: 'about' | 'vision',
    block: ContentBlock,
    previousImage: BlockImage | null,
  ): Observable<ContentBlock> {
    const path = kind === 'about' ? `${HOME_PATH}/about` : `${HOME_PATH}/vision-2030`;
    return this.resolveImageTicket(previousImage, block.image).pipe(
      switchMap((image) =>
        this.http.put<ApiEnvelope<HomePageDto>>(
          apiUrl(this.base, path),
          toBlockWrite(block, image),
        ),
      ),
      map((envelope) => {
        const home = mapHomePage(this.requireHome(envelope));
        return kind === 'about' ? home.about : home.vision;
      }),
    );
  }

  private resolveImageTicket(
    previous: BlockImage | null,
    next: BlockImage | null,
  ): Observable<string | null | undefined> {
    if (next?.file) {
      return this.media.upload('image', next.file).pipe(map((file) => file.uuid));
    }
    if (next === null) {
      return of(previous ? null : undefined);
    }
    return of(undefined);
  }

  private requireHome(envelope: ApiEnvelope<HomePageDto>): HomePageDto {
    const data = envelope?.data;
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid home page response');
    }
    return data;
  }

  private requirePartner(envelope: ApiEnvelope<HomePartnerDto>): HomePartnerDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid partner response');
    }
    return data;
  }
}
