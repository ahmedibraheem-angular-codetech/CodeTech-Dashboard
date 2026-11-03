import { Injectable, inject, signal } from '@angular/core';
import { type Observable, map, of } from 'rxjs';

import { ObjectUrls } from '../../../shared/components/product-upload/object-urls';
import type { Project } from '../models/project.model';
import { PROJECTS_SEED } from './project.fixtures';

/**
 * In-memory ProjectsService stand-in for component specs that need persistence
 * (editor upload lifecycle, list mutations) without HTTP.
 */
@Injectable()
export class ProjectsMemoryService {
  private readonly objectUrls = inject(ObjectUrls);
  private readonly state = signal<Project[]>(structuredClone(PROJECTS_SEED));
  readonly catalogVisible = signal(true);

  list(): Observable<Project[]> {
    return of(structuredClone(this.state()));
  }

  listAll(): Observable<Project[]> {
    return this.list();
  }

  get(id: string): Observable<Project | null> {
    const match = this.state().find((item) => item.id === id);
    return of(match ? structuredClone(match) : null);
  }

  save(project: Project): Observable<Project> {
    const next: Project = {
      ...structuredClone(project),
      id: project.id || `prj-${Date.now()}`,
      code: project.code || String(Date.now()).slice(-5),
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
    return of(structuredClone(next));
  }

  setPublished(id: string, published: boolean): Observable<Project> {
    let saved: Project | null = null;
    this.state.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }
        saved = { ...item, published };
        return saved;
      }),
    );
    return of(structuredClone(saved ?? ({ id, published } as Project)));
  }

  remove(id: string): Observable<void> {
    const previous = this.state().find((item) => item.id === id) ?? null;
    this.objectUrls.sync(previous, null);
    this.state.update((items) => items.filter((item) => item.id !== id));
    return of(undefined);
  }

  loadCatalogVisibility(): Observable<boolean> {
    return of(this.catalogVisible());
  }

  toggleCatalog(): void {
    this.catalogVisible.update((visible) => !visible);
  }

  reorder(_ids: readonly string[]): Observable<void> {
    return of(undefined);
  }
}
