import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { type Observable, catchError, map, switchMap, tap, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import type { ProfileUserDto } from '../auth/auth.model';
import { API_BASE_URL, apiUrl } from '../config/api';
import { toApiError } from '../http/api-error';
import type { ApiEnvelope } from '../http/api.model';
import { MediaService } from '../media/media.service';
import {
  type ChangePasswordRequest,
  type ProfileDraft,
  type UpdateProfileRequest,
  type UserProfile,
  apiPhone,
  apiUsername,
  displayUsername,
} from './profile.model';
import { PROFILE_SEED } from './profile.mock';

const PROFILE_PATH = 'admin/profile';
const PASSWORD_PATH = 'admin/profile/password';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private readonly auth = inject(AuthService);
  private readonly media = inject(MediaService);

  readonly profile = computed<UserProfile | null>(() => {
    const session = this.auth.session();
    if (!session) {
      return null;
    }
    if (session.profileLoaded) {
      return {
        name: session.name,
        email: session.email,
        roleKey: session.roleKey,
        username: displayUsername(session.username),
        phone: session.phone ?? '',
        lastLogin: session.lastLoginAt,
        avatarUrl: session.avatarUrl,
      };
    }
    return {
      ...PROFILE_SEED,
      name: session.name,
      email: session.email,
      roleKey: session.roleKey,
    };
  });

  update(draft: ProfileDraft): Observable<void> {
    return this.putProfile({
      name: draft.name.trim(),
      email: draft.email.trim(),
      username: apiUsername(draft.username),
      phone: apiPhone(draft.phone),
    });
  }

  changePassword(current: string, next: string, confirmation: string): Observable<void> {
    const body: ChangePasswordRequest = {
      current_password: current,
      password: next,
      password_confirmation: confirmation,
    };
    return this.http.put(apiUrl(this.base, PASSWORD_PATH), body).pipe(
      map(() => undefined),
      catchError((error: unknown) => throwError(() => this.normalize(error))),
    );
  }

  setAvatar(file: File): Observable<void> {
    return this.media.upload('image', file).pipe(
      switchMap((uploaded) => this.putProfile({ ...this.identityBody(), avatar: uploaded.uuid })),
      catchError((error: unknown) => throwError(() => this.normalize(error))),
    );
  }

  removeAvatar(): Observable<void> {
    return this.putProfile({ ...this.identityBody(), avatar: null });
  }

  private putProfile(body: UpdateProfileRequest): Observable<void> {
    return this.http.put<ApiEnvelope<ProfileUserDto>>(apiUrl(this.base, PROFILE_PATH), body).pipe(
      tap((envelope) => this.auth.syncFromProfileEnvelope(envelope)),
      map(() => undefined),
      catchError((error: unknown) => throwError(() => this.normalize(error))),
    );
  }

  private identityBody(): Omit<UpdateProfileRequest, 'avatar'> {
    const profile = this.profile();
    if (!profile) {
      throw new Error('No signed-in profile');
    }
    return {
      name: profile.name.trim(),
      email: profile.email.trim(),
      username: apiUsername(profile.username),
      phone: apiPhone(profile.phone),
    };
  }

  private normalize(error: unknown): unknown {
    if (error instanceof HttpErrorResponse) {
      return toApiError(error);
    }
    return error;
  }
}
