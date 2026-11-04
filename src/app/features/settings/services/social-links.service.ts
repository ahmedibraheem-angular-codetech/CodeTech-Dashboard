import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import type { ApiEnvelope } from '../../../core/http/api.model';
import type { SocialLinkDto, SocialLinkPublishWriteDto } from '../models/social-links.api';
import type { SocialChannel, SocialChannelDraft } from '../models/social-links.model';
import { mapSocialLink, toSocialLinkWrite } from './social-links.mapper';

const PATH = 'admin/social-links';

/**
 * Social channels CRUD + publish.
 * Reorder exists on the API but is not wired — the UI has no drag handle
 * (OpenAPI: "the design draws no drag handle").
 */
@Injectable({ providedIn: 'root' })
export class SocialLinksService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(): Observable<SocialChannel[]> {
    return this.http
      .get<ApiEnvelope<SocialLinkDto[]>>(apiUrl(this.base, PATH))
      .pipe(map((envelope) => this.requireList(envelope).map(mapSocialLink)));
  }

  create(draft: SocialChannelDraft): Observable<SocialChannel> {
    return this.http
      .post<ApiEnvelope<SocialLinkDto>>(apiUrl(this.base, PATH), toSocialLinkWrite(draft))
      .pipe(map((envelope) => mapSocialLink(this.requireOne(envelope))));
  }

  update(id: string, draft: SocialChannelDraft): Observable<SocialChannel> {
    return this.http
      .put<ApiEnvelope<SocialLinkDto>>(apiUrl(this.base, `${PATH}/${id}`), toSocialLinkWrite(draft))
      .pipe(map((envelope) => mapSocialLink(this.requireOne(envelope))));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  setPublished(id: string, published: boolean): Observable<SocialChannel> {
    const body: SocialLinkPublishWriteDto = { is_published: published };
    return this.http
      .patch<ApiEnvelope<SocialLinkDto>>(apiUrl(this.base, `${PATH}/${id}/publish`), body)
      .pipe(map((envelope) => mapSocialLink(this.requireOne(envelope))));
  }

  private requireList(envelope: ApiEnvelope<SocialLinkDto[]>): SocialLinkDto[] {
    return Array.isArray(envelope?.data) ? envelope.data : [];
  }

  private requireOne(envelope: ApiEnvelope<SocialLinkDto>): SocialLinkDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid social link response');
    }
    return data;
  }
}
