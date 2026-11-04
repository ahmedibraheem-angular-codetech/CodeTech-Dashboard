import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, catchError, map, of, switchMap, throwError } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import { statusOf, toApiError } from '../../../core/http/api-error';
import type { ApiEnvelope, PaginatedEnvelope } from '../../../core/http/api.model';
import { MediaService } from '../../../core/media/media.service';
import type { RoleListDto, UserDto, UserStatsDto, UserStatusWriteDto } from '../models/user.api';
import type {
  AssignableRole,
  User,
  UserDraft,
  UserListPage,
  UserListQuery,
  UserStats,
  UserStatus,
} from '../models/user.model';
import {
  isAssignableRoleId,
  isUserStatus,
  mapAssignableRole,
  mapUser,
  mapUserStats,
  toUserWriteDto,
} from './user.mapper';

const USERS_PATH = 'admin/users';
const ROLES_PATH = 'admin/roles';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private readonly media = inject(MediaService);

  list(query: UserListQuery): Observable<UserListPage> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('per_page', String(clampPerPage(query.perPage)));
    const search = query.search?.trim();
    if (search) {
      params = params.set('search', search);
    }
    if (query.status && isUserStatus(query.status)) {
      params = params.set('filter[status]', query.status);
    }
    if (query.roleId != null && Number.isInteger(query.roleId) && query.roleId > 0) {
      params = params.set('filter[role]', String(query.roleId));
    }
    return this.http
      .get<PaginatedEnvelope<UserDto>>(apiUrl(this.base, USERS_PATH), { params })
      .pipe(
        map((envelope) => ({
          items: (envelope.data ?? []).map(mapUser),
          total: envelope.meta?.total ?? 0,
        })),
        catchError((error: unknown) => throwError(() => this.normalize(error))),
      );
  }

  stats(): Observable<UserStats> {
    return this.http.get<ApiEnvelope<UserStatsDto>>(apiUrl(this.base, `${USERS_PATH}/stats`)).pipe(
      map((envelope) => mapUserStats(this.requireData(envelope))),
      catchError((error: unknown) => throwError(() => this.normalize(error))),
    );
  }

  roles(): Observable<AssignableRole[]> {
    return this.http.get<ApiEnvelope<RoleListDto[]>>(apiUrl(this.base, ROLES_PATH)).pipe(
      map((envelope) =>
        (envelope.data ?? [])
          .map(mapAssignableRole)
          .filter((role): role is AssignableRole => role !== null),
      ),
      catchError((error: unknown) => throwError(() => this.normalize(error))),
    );
  }

  get(id: string): Observable<User | null> {
    return this.http.get<ApiEnvelope<UserDto>>(apiUrl(this.base, `${USERS_PATH}/${id}`)).pipe(
      map((envelope) => mapUser(this.requireData(envelope))),
      catchError((error: unknown) => {
        if (
          statusOf(error) === 404 ||
          (error instanceof HttpErrorResponse && error.status === 404)
        ) {
          return of(null);
        }
        return throwError(() => this.normalize(error));
      }),
    );
  }

  create(draft: UserDraft, roles: readonly { id: number }[]): Observable<User> {
    const invalid = this.invalidWrite(draft, roles);
    if (invalid) {
      return throwError(() => invalid);
    }
    return this.resolveAvatar(draft.avatar).pipe(
      switchMap((avatar) =>
        this.http
          .post<ApiEnvelope<UserDto>>(apiUrl(this.base, USERS_PATH), toUserWriteDto(draft, avatar))
          .pipe(map((envelope) => mapUser(this.requireData(envelope)))),
      ),
      catchError((error: unknown) => throwError(() => this.normalize(error))),
    );
  }

  update(id: string, draft: UserDraft, roles: readonly { id: number }[]): Observable<User> {
    const invalid = this.invalidWrite(draft, roles);
    if (invalid) {
      return throwError(() => invalid);
    }
    return this.resolveAvatar(draft.avatar).pipe(
      switchMap((avatar) =>
        this.http
          .patch<ApiEnvelope<UserDto>>(
            apiUrl(this.base, `${USERS_PATH}/${id}`),
            toUserWriteDto(draft, avatar),
          )
          .pipe(map((envelope) => mapUser(this.requireData(envelope)))),
      ),
      catchError((error: unknown) => throwError(() => this.normalize(error))),
    );
  }

  setStatus(id: string, status: UserStatus, reason?: string | null): Observable<User> {
    if (!isUserStatus(status)) {
      return throwError(() => new Error('invalid-user-status'));
    }
    const body: UserStatusWriteDto = { status };
    const note = reason?.trim();
    if (note) {
      body.reason = note;
    }
    return this.http
      .patch<ApiEnvelope<UserDto>>(apiUrl(this.base, `${USERS_PATH}/${id}/status`), body)
      .pipe(
        map((envelope) => mapUser(this.requireData(envelope))),
        catchError((error: unknown) => throwError(() => this.normalize(error))),
      );
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${USERS_PATH}/${id}`), { responseType: 'text' })
      .pipe(
        map(() => undefined),
        catchError((error: unknown) => throwError(() => this.normalize(error))),
      );
  }

  exportCsv(query: Omit<UserListQuery, 'page' | 'perPage'>): Observable<Blob> {
    let params = new HttpParams();
    const search = query.search?.trim();
    if (search) {
      params = params.set('search', search);
    }
    if (query.status && isUserStatus(query.status)) {
      params = params.set('filter[status]', query.status);
    }
    if (query.roleId != null && Number.isInteger(query.roleId) && query.roleId > 0) {
      params = params.set('filter[role]', String(query.roleId));
    }
    return this.http
      .get(apiUrl(this.base, `${USERS_PATH}/export`), { params, responseType: 'blob' })
      .pipe(catchError((error: unknown) => throwError(() => this.normalize(error))));
  }

  private resolveAvatar(avatar: File | null | undefined): Observable<string | null | undefined> {
    if (!(avatar instanceof File)) {
      return of(avatar);
    }
    return this.media.upload('image', avatar).pipe(map((file) => file.uuid));
  }

  private invalidWrite(draft: UserDraft, roles: readonly { id: number }[]): Error | null {
    if (!isAssignableRoleId(draft.roleId, roles)) {
      return new Error('invalid-role');
    }
    if (!isUserStatus(draft.status)) {
      return new Error('invalid-user-status');
    }
    return null;
  }

  private requireData<T>(envelope: ApiEnvelope<T>): T {
    if (envelope?.data === undefined || envelope?.data === null) {
      throw new Error('empty-user-envelope');
    }
    return envelope.data;
  }

  private normalize(error: unknown): unknown {
    if (error instanceof HttpErrorResponse) {
      return toApiError(error);
    }
    return error;
  }
}

function clampPerPage(value: number): number {
  if (!Number.isFinite(value)) {
    return 10;
  }
  return Math.min(100, Math.max(1, Math.trunc(value)));
}
