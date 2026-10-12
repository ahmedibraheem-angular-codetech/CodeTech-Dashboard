import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { ContentBlock, HomepageContent, Partner } from '../models/homepage.model';
import { HOMEPAGE_SEED } from './homepage.mock';

@Injectable({ providedIn: 'root' })
export class HomepageService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly state = signal<HomepageContent>(structuredClone(HOMEPAGE_SEED));

  load(): Observable<HomepageContent> {
    return timer(this.latency).pipe(map(() => structuredClone(this.state())));
  }

  savePartner(partner: Partner): Observable<Partner> {
    return timer(this.latency).pipe(
      map(() => {
        this.state.update((current) => {
          const exists = current.partners.some((item) => item.id === partner.id);
          const partners = exists
            ? current.partners.map((item) => (item.id === partner.id ? partner : item))
            : [...current.partners, partner];
          return { ...current, partners };
        });
        return partner;
      }),
    );
  }

  removePartner(id: string): Observable<void> {
    return timer(this.latency).pipe(
      map(() => {
        this.state.update((current) => ({
          ...current,
          partners: current.partners.filter((partner) => partner.id !== id),
        }));
      }),
    );
  }

  setVideoEnabled(enabled: boolean): void {
    this.state.update((current) => ({ ...current, videoEnabled: enabled }));
  }

  setVideoName(videoName: string | null): Observable<void> {
    return timer(this.latency).pipe(
      map(() => {
        this.state.update((current) => ({ ...current, videoName }));
      }),
    );
  }

  saveBlock(kind: 'about' | 'vision', block: ContentBlock): Observable<ContentBlock> {
    return timer(this.latency).pipe(
      map(() => {
        this.state.update((current) => ({ ...current, [kind]: block }));
        return block;
      }),
    );
  }
}
