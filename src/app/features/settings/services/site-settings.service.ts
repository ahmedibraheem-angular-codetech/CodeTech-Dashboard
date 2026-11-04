import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map, of, switchMap } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import type { ApiEnvelope } from '../../../core/http/api.model';
import { MediaService } from '../../../core/media/media.service';
import type { SiteSettingsDto } from '../models/site-settings.api';
import type { SiteSettings, SiteSettingsDraft } from '../models/site-settings.model';
import { mapSiteSettings, resolveLogoUuid, toSiteSettingsWrite } from './site-settings.mapper';

const PATH = 'admin/site-settings';

/**
 * Singleton site details (description, contact, location, logo).
 * Logo uses coat-check media UUID: omit to keep, null to remove, UUID to replace.
 */
@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private readonly http = inject(HttpClient);
  private readonly media = inject(MediaService);
  private readonly base = inject(API_BASE_URL);

  get(): Observable<SiteSettings> {
    return this.http
      .get<ApiEnvelope<SiteSettingsDto>>(apiUrl(this.base, PATH))
      .pipe(map((envelope) => mapSiteSettings(this.requireOne(envelope))));
  }

  save(draft: SiteSettingsDraft): Observable<SiteSettings> {
    return this.resolveLogo(draft).pipe(
      switchMap((logoUuid) =>
        this.http.put<ApiEnvelope<SiteSettingsDto>>(
          apiUrl(this.base, PATH),
          toSiteSettingsWrite(draft, logoUuid),
        ),
      ),
      map((envelope) => mapSiteSettings(this.requireOne(envelope))),
    );
  }

  private resolveLogo(draft: SiteSettingsDraft): Observable<string | null | undefined> {
    const intent = draft.logo;
    if (intent.kind === 'omit' || intent.kind === 'clear') {
      return of(resolveLogoUuid(intent, undefined));
    }
    return this.media
      .upload('image', intent.file)
      .pipe(map((file) => resolveLogoUuid(intent, file.uuid)));
  }

  private requireOne(envelope: ApiEnvelope<SiteSettingsDto>): SiteSettingsDto {
    const data = envelope?.data;
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid site settings response');
    }
    return data;
  }
}
