import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, catchError, map, of, switchMap, throwError } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import type { ApiEnvelope, PaginatedEnvelope } from '../../../core/http/api.model';
import { statusOf } from '../../../core/http/api-error';
import type {
  ProjectRequestDetailDto,
  ProjectRequestListDto,
  ProjectRequestNoteDto,
  ProjectRequestReplyDto,
  ProjectRequestStatsDto,
  ProjectRequestStatusWriteDto,
} from '../models/project-request.api';
import type { Inquiry, InquiryStats } from '../models/inquiry.model';
import type { ContactInboxApi } from './contact-inbox.api';
import {
  mapProjectRequestDetail,
  mapProjectRequestListItem,
  mapProjectRequestStats,
} from './project-request.mapper';

const PATH = 'admin/project-requests';
const PAGE_SIZE = 100;

@Injectable({ providedIn: 'root' })
export class ProjectRequestsService implements ContactInboxApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(): Observable<Inquiry[]> {
    return this.fetchAll();
  }

  stats(): Observable<InquiryStats> {
    return this.http
      .get<ApiEnvelope<ProjectRequestStatsDto>>(apiUrl(this.base, `${PATH}/stats`))
      .pipe(map((envelope) => mapProjectRequestStats(this.requireData(envelope))));
  }

  get(id: string): Observable<Inquiry | null> {
    return this.http
      .get<ApiEnvelope<ProjectRequestDetailDto>>(apiUrl(this.base, `${PATH}/${id}`))
      .pipe(
        map((envelope) => mapProjectRequestDetail(this.requireData(envelope))),
        catchError((error: unknown) => {
          if (statusOf(error) === 404) {
            return of(null);
          }
          return throwError(() => error);
        }),
      );
  }

  addNote(id: string, body: string): Observable<Inquiry> {
    return this.http
      .post<ApiEnvelope<ProjectRequestNoteDto>>(apiUrl(this.base, `${PATH}/${id}/notes`), {
        body,
      })
      .pipe(switchMap(() => this.requireGet(id)));
  }

  addReply(id: string, body: string): Observable<Inquiry> {
    return this.http
      .post<ApiEnvelope<ProjectRequestReplyDto>>(apiUrl(this.base, `${PATH}/${id}/replies`), {
        body,
      })
      .pipe(switchMap(() => this.requireGet(id)));
  }

  close(id: string, note?: string | null): Observable<Inquiry> {
    const payload: ProjectRequestStatusWriteDto = { status: 'closed' };
    if (note != null && note.trim()) {
      payload.note = note.trim();
    }
    return this.http
      .patch<ApiEnvelope<ProjectRequestDetailDto>>(
        apiUrl(this.base, `${PATH}/${id}/status`),
        payload,
      )
      .pipe(map((envelope) => mapProjectRequestDetail(this.requireData(envelope))));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(apiUrl(this.base, `${PATH}/export`), { responseType: 'blob' });
  }

  private requireGet(id: string): Observable<Inquiry> {
    return this.get(id).pipe(
      switchMap((item) =>
        item ? of(item) : throwError(() => new Error(`missing-project-request:${id}`)),
      ),
    );
  }

  private fetchAll(page = 1, acc: Inquiry[] = []): Observable<Inquiry[]> {
    const params = new HttpParams().set('per_page', String(PAGE_SIZE)).set('page', String(page));
    return this.http
      .get<PaginatedEnvelope<ProjectRequestListDto>>(apiUrl(this.base, PATH), { params })
      .pipe(
        switchMap((envelope) => {
          const batch = (envelope.data ?? []).map(mapProjectRequestListItem);
          const next = [...acc, ...batch];
          const lastPage = envelope.meta?.last_page ?? 1;
          if (page >= lastPage) {
            return of(next);
          }
          return this.fetchAll(page + 1, next);
        }),
      );
  }

  private requireData<T>(envelope: ApiEnvelope<T>): T {
    if (envelope?.data === undefined || envelope?.data === null) {
      throw new Error('empty-project-request-envelope');
    }
    return envelope.data;
  }
}
