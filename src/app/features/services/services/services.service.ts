import { Injectable, inject, signal } from '@angular/core';
import { type Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { ObjectUrls } from '../../../shared/components/product-upload/object-urls';
import type { Service } from '../models/service.model';
import { SERVICES_SEED } from './services.mock';

@Injectable({ providedIn: 'root' })
export class ServicesService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly objectUrls = inject(ObjectUrls);
  private readonly state = signal<Service[]>(structuredClone(SERVICES_SEED));

  list(): Observable<Service[]> {
    return timer(this.latency).pipe(map(() => structuredClone(this.state())));
  }

  get(id: string): Observable<Service | null> {
    return timer(this.latency).pipe(
      map(() => {
        const match = this.state().find((item) => item.id === id);
        return match ? structuredClone(match) : null;
      }),
    );
  }

  save(service: Service): Observable<Service> {
    const next: Service = {
      ...structuredClone(service),
      id: service.id || this.newId(),
    };
    const previous = this.state().find((item) => item.id === next.id) ?? null;
    this.objectUrls.sync(previous, next);
    this.state.update((items) => {
      const index = items.findIndex((item) => item.id === next.id);
      if (index === -1) {
        return [next, ...items];
      }
      return items.map((item) => (item.id === next.id ? next : item));
    });
    return timer(this.latency).pipe(map(() => structuredClone(next)));
  }

  setPublished(id: string, published: boolean): void {
    this.state.update((items) =>
      items.map((item) => (item.id === id ? { ...item, published } : item)),
    );
  }

  remove(id: string): Observable<void> {
    const previous = this.state().find((item) => item.id === id) ?? null;
    this.objectUrls.sync(previous, null);
    this.state.update((items) => items.filter((item) => item.id !== id));
    return timer(this.latency).pipe(map(() => undefined));
  }

  private newId(): string {
    let stamp = Date.now();
    while (this.state().some((item) => item.id === `svc-${stamp}`)) {
      stamp += 1;
    }
    return `svc-${stamp}`;
  }
}
