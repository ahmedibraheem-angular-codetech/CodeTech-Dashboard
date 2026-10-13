import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { AboutCeo, AboutContent, AboutGroups, AboutMember } from '../models/about.model';
import { ABOUT_SEED } from './about.mock';

@Injectable({ providedIn: 'root' })
export class AboutService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly state = signal<AboutContent>(structuredClone(ABOUT_SEED));

  load(): Observable<AboutContent> {
    return timer(this.latency).pipe(map(() => structuredClone(this.state())));
  }

  saveStory(story: AboutGroups): Observable<AboutGroups> {
    return this.patch('story', story);
  }

  saveVision(vision: AboutGroups): Observable<AboutGroups> {
    return this.patch('vision', vision);
  }

  saveCeo(ceo: AboutCeo): Observable<AboutCeo> {
    return timer(this.latency).pipe(
      map(() => {
        const next = structuredClone(ceo);
        this.state.update((current) => ({ ...current, ceo: next }));
        return structuredClone(next);
      }),
    );
  }

  saveMember(member: AboutMember): Observable<AboutMember> {
    return timer(this.latency).pipe(
      map(() => {
        const next = structuredClone(member);
        this.state.update((current) => {
          const exists = current.team.some((item) => item.id === next.id);
          const team = exists
            ? current.team.map((item) => (item.id === next.id ? next : item))
            : [...current.team, next];
          return { ...current, team };
        });
        return structuredClone(next);
      }),
    );
  }

  removeMember(id: string): Observable<void> {
    return timer(this.latency).pipe(
      map(() => {
        this.state.update((current) => ({
          ...current,
          team: current.team.filter((item) => item.id !== id),
        }));
      }),
    );
  }

  private patch<K extends 'story' | 'vision'>(
    key: K,
    value: AboutContent[K],
  ): Observable<AboutContent[K]> {
    return timer(this.latency).pipe(
      map(() => {
        const next = structuredClone(value);
        this.state.update((current) => ({ ...current, [key]: next }));
        return structuredClone(next);
      }),
    );
  }
}
