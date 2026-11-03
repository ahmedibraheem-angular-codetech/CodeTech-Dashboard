import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, forkJoin, map, of, switchMap } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import type { ApiEnvelope } from '../../../core/http/api.model';
import type {
  ProjectsPageDto,
  ProjectsPageSectionsWriteDto,
  ProjectsPageStatDto,
} from '../models/project.api';
import type { ProjectsPageContent, ProjectsPageStat } from '../models/projects-page.model';
import {
  mapProjectsPage,
  mapProjectsPageStat,
  toProjectsPageStatWrite,
} from './projects-page.mapper';

const PAGE_PATH = 'admin/pages/projects';
const STATS_PATH = 'admin/projects-page/stats';

/**
 * Projects marketing page manager.
 * Section switches: PATCH /admin/pages/projects/sections.
 * Stats: CRUD under /admin/projects-page/stats (+ reorder).
 */
@Injectable({ providedIn: 'root' })
export class ProjectsPageService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  get(): Observable<ProjectsPageContent> {
    return this.http
      .get<ApiEnvelope<ProjectsPageDto>>(apiUrl(this.base, PAGE_PATH))
      .pipe(map((envelope) => mapProjectsPage(this.requirePage(envelope))));
  }

  toggleNumbers(enabled: boolean): Observable<ProjectsPageContent> {
    return this.patchSections({ stats_visible: enabled });
  }

  saveNumbers(numbers: ProjectsPageStat[]): Observable<ProjectsPageStat[]> {
    if (numbers.length === 0) {
      return of([]);
    }
    return forkJoin(numbers.map((stat) => this.saveStat(stat))).pipe(
      switchMap((saved) => this.reorderStats(saved.map((item) => item.id)).pipe(map(() => saved))),
    );
  }

  removeStat(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${STATS_PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  private saveStat(stat: ProjectsPageStat): Observable<ProjectsPageStat> {
    const body = toProjectsPageStatWrite(stat);
    if (!stat.id || !/^\d+$/.test(stat.id)) {
      return this.http
        .post<ApiEnvelope<ProjectsPageStatDto>>(apiUrl(this.base, STATS_PATH), body)
        .pipe(map((envelope) => mapProjectsPageStat(this.requireStat(envelope))));
    }
    return this.http
      .put<ApiEnvelope<ProjectsPageStatDto>>(apiUrl(this.base, `${STATS_PATH}/${stat.id}`), body)
      .pipe(map((envelope) => mapProjectsPageStat(this.requireStat(envelope))));
  }

  private reorderStats(ids: readonly string[]): Observable<void> {
    return this.http
      .post(
        apiUrl(this.base, `${STATS_PATH}/reorder`),
        { ids: ids.map((id) => Number(id)).filter((id) => Number.isFinite(id)) },
        { responseType: 'text' },
      )
      .pipe(map(() => undefined));
  }

  private patchSections(body: ProjectsPageSectionsWriteDto): Observable<ProjectsPageContent> {
    return this.http
      .patch<ApiEnvelope<ProjectsPageDto>>(apiUrl(this.base, `${PAGE_PATH}/sections`), body)
      .pipe(map((envelope) => mapProjectsPage(this.requirePage(envelope))));
  }

  private requirePage(envelope: ApiEnvelope<ProjectsPageDto>): ProjectsPageDto {
    const data = envelope?.data;
    if (!data?.sections) {
      throw new Error('Invalid projects page response');
    }
    return data;
  }

  private requireStat(envelope: ApiEnvelope<ProjectsPageStatDto>): ProjectsPageStatDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid projects page stat response');
    }
    return data;
  }
}
