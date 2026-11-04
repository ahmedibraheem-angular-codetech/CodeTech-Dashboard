import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, catchError, map, of, throwError } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import { statusOf, toApiError } from '../../../core/http/api-error';
import type { ApiEnvelope } from '../../../core/http/api.model';
import type {
  PermissionCatalogDto,
  RoleDetailDto,
  RoleSummaryDto,
  RoleWriteDto,
} from '../models/permissions.api';
import type { PermissionCatalog, PermissionRole } from '../models/permissions.model';
import { mapPermissionCatalog, mapRoleDetail, mapRoleSummary } from '../models/permissions.model';

const ROLES_PATH = 'admin/roles';
const PERMISSIONS_PATH = 'admin/permissions';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  catalog(): Observable<PermissionCatalog> {
    return this.http
      .get<ApiEnvelope<PermissionCatalogDto>>(apiUrl(this.base, PERMISSIONS_PATH))
      .pipe(
        map((envelope) => mapPermissionCatalog(this.requireData(envelope))),
        catchError((error: unknown) => throwError(() => this.normalize(error))),
      );
  }

  list(): Observable<PermissionRole[]> {
    return this.http.get<ApiEnvelope<RoleSummaryDto[]>>(apiUrl(this.base, ROLES_PATH)).pipe(
      map((envelope) => (envelope.data ?? []).map(mapRoleSummary)),
      catchError((error: unknown) => throwError(() => this.normalize(error))),
    );
  }

  get(id: string): Observable<PermissionRole | null> {
    return this.http.get<ApiEnvelope<RoleDetailDto>>(apiUrl(this.base, `${ROLES_PATH}/${id}`)).pipe(
      map((envelope) => mapRoleDetail(this.requireData(envelope))),
      catchError((error: unknown) => {
        if (statusOf(error) === 404) {
          return of(null);
        }
        return throwError(() => this.normalize(error));
      }),
    );
  }

  create(name: string, permissions: readonly string[]): Observable<PermissionRole> {
    const body: RoleWriteDto = { name: name.trim(), permissions: [...permissions] };
    return this.http.post<ApiEnvelope<RoleDetailDto>>(apiUrl(this.base, ROLES_PATH), body).pipe(
      map((envelope) => mapRoleDetail(this.requireData(envelope))),
      catchError((error: unknown) => throwError(() => this.normalize(error))),
    );
  }

  update(id: string, name: string, permissions: readonly string[]): Observable<PermissionRole> {
    const body: RoleWriteDto = { name: name.trim(), permissions: [...permissions] };
    return this.http
      .put<ApiEnvelope<RoleDetailDto>>(apiUrl(this.base, `${ROLES_PATH}/${id}`), body)
      .pipe(
        map((envelope) => mapRoleDetail(this.requireData(envelope))),
        catchError((error: unknown) => throwError(() => this.normalize(error))),
      );
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${ROLES_PATH}/${id}`), { responseType: 'text' })
      .pipe(
        map(() => undefined),
        catchError((error: unknown) => throwError(() => this.normalize(error))),
      );
  }

  private requireData<T>(envelope: ApiEnvelope<T>): T {
    if (envelope?.data === undefined || envelope?.data === null) {
      throw new Error('empty-role-envelope');
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
