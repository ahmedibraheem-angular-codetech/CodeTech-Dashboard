import { Injectable, inject, signal } from '@angular/core';
import { type Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { toIsoDate } from '../../../shared/utils/date';
import type {
  SocialChannel,
  SocialChannelDraft,
  SocialLinksDocument,
  SocialPlatformId,
} from '../models/social-links.model';
import { SOCIAL_LINKS_SEED } from './social-links.mock';

@Injectable({ providedIn: 'root' })
export class SocialLinksService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly document = signal<SocialLinksDocument>(structuredClone(SOCIAL_LINKS_SEED));

  get(): Observable<SocialLinksDocument> {
    return timer(this.latency).pipe(map(() => structuredClone(this.document())));
  }

  save(next: SocialLinksDocument): Observable<SocialLinksDocument> {
    return timer(this.latency).pipe(
      map(() => {
        const saved: SocialLinksDocument = {
          ...structuredClone(next),
          updatedAt: toIsoDate(new Date()),
        };
        this.document.set(saved);
        return structuredClone(saved);
      }),
    );
  }

  upsertChannel(draft: SocialChannelDraft, id?: string): Observable<SocialLinksDocument> {
    return timer(this.latency).pipe(
      map(() => {
        const current = structuredClone(this.document());
        if (id) {
          current.channels = current.channels.map((item) =>
            item.id === id
              ? {
                  ...item,
                  platform: draft.platform,
                  status: draft.status,
                  url: structuredClone(draft.url),
                  enabled: draft.status === 'published' ? item.enabled : false,
                }
              : item,
          );
        } else {
          const channel: SocialChannel = {
            id: `ch-${draft.platform}-${Date.now()}`,
            platform: draft.platform,
            enabled: draft.status === 'published',
            status: draft.status,
            url: structuredClone(draft.url),
          };
          current.channels = [...current.channels, channel];
        }
        current.updatedAt = toIsoDate(new Date());
        this.document.set(current);
        return structuredClone(current);
      }),
    );
  }

  removeChannel(id: string): Observable<SocialLinksDocument> {
    return timer(this.latency).pipe(
      map(() => {
        const current = structuredClone(this.document());
        current.channels = current.channels.filter((item) => item.id !== id);
        current.updatedAt = toIsoDate(new Date());
        this.document.set(current);
        return structuredClone(current);
      }),
    );
  }

  setChannelEnabled(id: string, enabled: boolean): Observable<SocialLinksDocument> {
    return timer(this.latency).pipe(
      map(() => {
        const current = structuredClone(this.document());
        current.channels = current.channels.map((item) =>
          item.id === id
            ? {
                ...item,
                enabled,
                status: enabled ? 'published' : item.status,
              }
            : item,
        );
        current.updatedAt = toIsoDate(new Date());
        this.document.set(current);
        return structuredClone(current);
      }),
    );
  }

  availablePlatforms(excludeId?: string): SocialPlatformId[] {
    const used = new Set(
      this.document()
        .channels.filter((item) => item.id !== excludeId)
        .map((item) => item.platform),
    );
    return (
      ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'snapchat', 'whatsapp'] as const
    ).filter((platform) => !used.has(platform));
  }
}
