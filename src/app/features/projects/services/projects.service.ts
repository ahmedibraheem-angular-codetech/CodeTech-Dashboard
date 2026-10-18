import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import type { Project } from '../models/project.model';
import { PROJECTS_SEED } from './projects.mock';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly state = signal<Project[]>(structuredClone(PROJECTS_SEED));
  readonly catalogVisible = signal(true);

  list(): Observable<Project[]> {
    return timer(this.latency).pipe(map(() => structuredClone(this.state())));
  }

  get(id: string): Observable<Project | null> {
    return timer(this.latency).pipe(
      map(() => {
        const match = this.state().find((item) => item.id === id);
        return match ? structuredClone(match) : null;
      }),
    );
  }

  save(project: Project): Observable<Project> {
    const next: Project = { ...project, id: project.id || `prj-${Date.now()}` };
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
    this.state.update((items) => items.filter((item) => item.id !== id));
    return timer(this.latency).pipe(map(() => undefined));
  }

  toggleCatalog(): void {
    this.catalogVisible.update((visible) => !visible);
  }
}
