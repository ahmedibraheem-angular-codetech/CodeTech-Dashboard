import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import type { ProjectsPageContent, ProjectsPageStat } from '../models/projects-page.model';
import { PROJECTS_PAGE_SEED } from './projects-page.mock';

@Injectable({ providedIn: 'root' })
export class ProjectsPageService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly state = signal<ProjectsPageContent>(structuredClone(PROJECTS_PAGE_SEED));

  get(): Observable<ProjectsPageContent> {
    return timer(this.latency).pipe(map(() => structuredClone(this.state())));
  }

  toggleNumbers(enabled: boolean): void {
    this.state.update((current) => ({ ...current, numbersEnabled: enabled }));
  }

  saveNumbers(numbers: ProjectsPageStat[]): Observable<ProjectsPageStat[]> {
    const next = structuredClone(numbers);
    this.state.update((current) => ({ ...current, numbers: next }));
    return timer(this.latency).pipe(map(() => structuredClone(next)));
  }

  removeStat(id: string): Observable<void> {
    this.state.update((current) => ({
      ...current,
      numbers: current.numbers.filter((item) => item.id !== id),
    }));
    return timer(this.latency).pipe(map(() => undefined));
  }
}
