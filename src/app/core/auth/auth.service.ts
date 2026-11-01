import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { type Observable, catchError, finalize, map, of, shareReplay, tap, throwError, timer } from 'rxjs';

import { TEMPORARY_DEMO_OTP } from '../../../environments/environment.model';
import { API_BASE_URL, apiUrl } from '../config/api';
import { API_LATENCY_MS } from '../config/latency';
import { isApiError, toApiError } from '../http/api-error';
import type { ApiEnvelope, FileObject } from '../http/api.model';
import { AuthError } from './auth.error';
import type {
  AuthSession,
  LoginPayload,
  LoginRequest,
  PendingAuth,
  PermissionName,
  ProfileUserDto,
  StoredAuthSession,
} from './auth.model';

const SESSION_KEY = 'codetech.session';
const PENDING_KEY = 'codetech.pending';

const LOGIN_PATH = 'admin/auth/login';
const LOGOUT_PATH = 'admin/auth/logout';
const PROFILE_PATH = 'admin/profile';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private readonly latency = inject(API_LATENCY_MS);

  readonly session = signal<AuthSession | null>(this.readSession());
  readonly pendingEmail = signal<string | null>(this.readPending()?.email ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly permissions = computed(() => this.session()?.permissions ?? []);

  private profileReady = this.session() === null;
  private restore$: Observable<boolean> | null = null;

  hasPermission(name: PermissionName): boolean {
    return this.permissions().includes(name);
  }

  hasAny(names: readonly PermissionName[]): boolean {
    if (names.length === 0) {
      return false;
    }
    const held = this.permissions();
    return names.some((name) => held.includes(name));
  }

  hasAll(names: readonly PermissionName[]): boolean {
    if (names.length === 0) {
      return false;
    }
    const held = this.permissions();
    return names.every((name) => held.includes(name));
  }

  login(email: string, password: string, remember = false): Observable<void> {
    const body: LoginRequest = { email: email.trim(), password, remember };
    return this.http.post<ApiEnvelope<LoginPayload>>(apiUrl(this.base, LOGIN_PATH), body).pipe(
      map((envelope) => this.requireLogin(envelope)),
      tap((payload) => this.storePending(this.toPending(payload, remember))),
      map(() => undefined),
      catchError((error: unknown) => {
        this.clearPending();
        const normalized = this.normalize(error);
        if (isApiError(normalized) && normalized.status === 422) {
          return throwError(() => new AuthError('invalid-password'));
        }
        return throwError(() => normalized);
      }),
    );
  }

  verify(code: string): Observable<void> {
    const pending = this.readPending();
    if (!pending) {
      return throwError(() => new AuthError('missing-pending'));
    }
    if (code !== TEMPORARY_DEMO_OTP) {
      return throwError(() => new AuthError('invalid-otp'));
    }
    return this.loadProfile(pending.token).pipe(
      tap((profile) => {
        this.activate(this.sessionFromProfile(pending.token, pending.remember, profile));
        this.clearPending();
      }),
      map(() => undefined),
      catchError((error: unknown) => {

        this.clearSession();
        this.clearPending();
        return throwError(() => this.normalize(error));
      }),
    );
  }

  resend(): Observable<void> {
    return of(undefined);
  }

  requestPasswordReset(email: string): Observable<string> {
    return timer(this.latency).pipe(map(() => email.trim()));
  }

  logout(): void {
    const token = this.session()?.token ?? this.readSession()?.token;
    this.clearAllAuth();
    if (!token) {
      return;
    }
    this.http
      .post(apiUrl(this.base, LOGOUT_PATH), {}, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
        responseType: 'text',
      })
      .subscribe({ error: () => undefined });
  }

  expireSession(): boolean {
    const hadSession = this.session() !== null || this.readSession() !== null;
    this.clearAllAuth();
    return hadSession;
  }

  hasPendingLogin(): boolean {
    return this.pendingEmail() !== null;
  }

  cancelPending(): void {
    this.clearPending();
  }

  ensureSession(): Observable<boolean> {
    if (this.session()?.profileLoaded) {
      this.profileReady = true;
      return of(true);
    }
    const stored = this.session() ?? this.readSession();
    if (!stored) {
      this.profileReady = true;
      return of(false);
    }

    if (this.session() && !this.readSession()) {
      this.profileReady = true;
      return of(true);
    }
    if (this.restore$) {
      return this.restore$;
    }
    this.restore$ = this.loadProfile(stored.token).pipe(
      tap((profile) => {
        this.activate(this.sessionFromProfile(stored.token, stored.remember, profile));
      }),
      map(() => true),
      catchError(() => {

        this.clearSession();
        return of(false);
      }),
      finalize(() => {
        this.restore$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    return this.restore$;
  }

  private activate(session: AuthSession): void {
    this.session.set(session);
    this.writeSession(session);
    this.profileReady = true;
  }

  private sessionFromProfile(
    token: string,
    remember: boolean,
    profile: ProfileUserDto,
  ): AuthSession {
    return {
      token,
      email: profile.email,
      name: profile.name,
      roleKey: profile.role.name,
      remember,
      profileLoaded: true,
      avatarUrl: this.avatarUrlFromFile(profile.avatar),
      permissions: this.normalizePermissions(profile.permissions),
      lastLoginAt: profile.last_login_at,
      username: profile.username,
      phone: profile.phone,
    };
  }

  private loadProfile(token: string): Observable<ProfileUserDto> {
    return this.http
      .get<ApiEnvelope<ProfileUserDto>>(apiUrl(this.base, PROFILE_PATH), this.tokenOptions(token))
      .pipe(map((envelope) => this.requireProfile(envelope)));
  }

  private tokenOptions(token: string): { headers: HttpHeaders; responseType: 'json' } {
    return {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      responseType: 'json',
    };
  }

  private toPending(payload: LoginPayload, remember: boolean): PendingAuth {
    return {
      token: payload.token,
      email: payload.user.email,
      name: payload.user.name,
      roleKey: payload.user.role.name,
      remember,
    };
  }

  private storePending(pending: PendingAuth): void {
    this.pendingEmail.set(pending.email);
    this.writePending(pending);
  }

  private clearPending(): void {
    this.pendingEmail.set(null);
    this.writePending(null);
  }

  private clearSession(): void {
    this.session.set(null);
    this.profileReady = false;
    this.writeSession(null);
  }

  private clearAllAuth(): void {
    this.clearSession();
    this.clearPending();
  }

  private requireLogin(envelope: ApiEnvelope<LoginPayload>): LoginPayload {
    const data = envelope?.data;
    if (!data || typeof data.token !== 'string' || typeof data.user?.email !== 'string') {
      throw new AuthError('unavailable');
    }
    return data;
  }

  private requireProfile(envelope: ApiEnvelope<ProfileUserDto>): ProfileUserDto {
    const data = envelope?.data;
    if (!data || typeof data.email !== 'string' || typeof data.name !== 'string') {
      throw new AuthError('unavailable');
    }
    const roleName = data.role?.name;
    if (typeof roleName !== 'string') {
      throw new AuthError('unavailable');
    }
    return {
      id: typeof data.id === 'number' ? data.id : 0,
      code: typeof data.code === 'string' ? data.code : '',
      name: data.name,
      username: this.nullableString(data.username),
      email: data.email,
      phone: this.nullableString(data.phone),
      status: typeof data.status === 'string' ? data.status : 'active',
      role: {
        id: typeof data.role?.id === 'number' ? data.role.id : 0,
        name: roleName,
        is_protected: data.role?.is_protected === true,
      },
      avatar: this.asFileObject(data.avatar),
      blocked_reason: this.nullableString(data.blocked_reason),
      blocked_at: this.nullableString(data.blocked_at),
      last_login_at: this.nullableString(data.last_login_at),
      last_activity_at: this.nullableString(data.last_activity_at),
      created_at: typeof data.created_at === 'string' ? data.created_at : '',
      updated_at: typeof data.updated_at === 'string' ? data.updated_at : '',
      birth_date: this.nullableString(data.birth_date),
      about: this.nullableString(data.about),
      permissions: this.normalizePermissions(data.permissions),
    };
  }

  private normalizePermissions(value: unknown): PermissionName[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
  }

  private avatarUrlFromFile(file: FileObject | null): string | null {
    return file?.url ?? null;
  }

  private asFileObject(value: unknown): FileObject | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const file = value as Partial<FileObject>;
    if (typeof file.uuid !== 'string' || typeof file.url !== 'string') {
      return null;
    }
    return {
      uuid: file.uuid,
      name: typeof file.name === 'string' ? file.name : '',
      file_name: typeof file.file_name === 'string' ? file.file_name : '',
      mime_type: typeof file.mime_type === 'string' ? file.mime_type : '',
      size: typeof file.size === 'number' ? file.size : 0,
      url: file.url,
      download_url: typeof file.download_url === 'string' ? file.download_url : '',
      created_at: typeof file.created_at === 'string' ? file.created_at : '',
    };
  }

  private nullableString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  private normalize(error: unknown): unknown {
    if (error instanceof HttpErrorResponse) {
      return toApiError(error);
    }
    return error;
  }

  private readSession(): AuthSession | null {
    const fromSession = this.parseSession(this.readKey(sessionStorage, SESSION_KEY), false);
    if (fromSession) {
      return fromSession;
    }
    return this.parseSession(this.readKey(localStorage, SESSION_KEY), true);
  }

  private readPending(): PendingAuth | null {
    return this.parsePending(this.readKey(sessionStorage, PENDING_KEY));
  }

  private writeSession(session: AuthSession | null): void {
    this.removeKey(sessionStorage, SESSION_KEY);
    this.removeKey(localStorage, SESSION_KEY);
    if (!session) {
      return;
    }
    const stored: StoredAuthSession = {
      token: session.token,
      email: session.email,
      name: session.name,
      roleKey: session.roleKey,
      remember: session.remember,
    };
    this.writeKey(session.remember ? localStorage : sessionStorage, SESSION_KEY, stored);
  }

  private writePending(pending: PendingAuth | null): void {
    this.removeKey(sessionStorage, PENDING_KEY);
    this.removeKey(localStorage, PENDING_KEY);
    if (!pending) {
      return;
    }
    this.writeKey(sessionStorage, PENDING_KEY, pending);
  }

  private parseSession(raw: string | null, rememberFallback: boolean): AuthSession | null {
    const record = this.parseRecord(raw);
    if (!record) {
      return null;
    }
    if (
      typeof record['token'] !== 'string' ||
      typeof record['email'] !== 'string' ||
      typeof record['name'] !== 'string' ||
      typeof record['roleKey'] !== 'string'
    ) {
      return null;
    }
    return this.emptySessionFields({
      token: record['token'],
      email: record['email'],
      name: record['name'],
      roleKey: record['roleKey'],
      remember: typeof record['remember'] === 'boolean' ? record['remember'] : rememberFallback,
    });
  }

  private emptySessionFields(stored: StoredAuthSession): AuthSession {
    return {
      ...stored,
      profileLoaded: false,
      avatarUrl: null,
      permissions: [],
      lastLoginAt: null,
      username: null,
      phone: null,
    };
  }

  private parsePending(raw: string | null): PendingAuth | null {
    const record = this.parseRecord(raw);
    if (!record) {
      return null;
    }
    if (
      typeof record['token'] !== 'string' ||
      typeof record['email'] !== 'string' ||
      typeof record['name'] !== 'string' ||
      typeof record['roleKey'] !== 'string'
    ) {
      return null;
    }
    return {
      token: record['token'],
      email: record['email'],
      name: record['name'],
      roleKey: record['roleKey'],
      remember: record['remember'] === true,
    };
  }

  private parseRecord(raw: string | null): Record<string, unknown> | null {
    if (!raw) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) {
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private readKey(storage: Storage, key: string): string | null {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeKey(storage: Storage, key: string, value: unknown): void {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore private-mode storage failures.
    }
  }

  private removeKey(storage: Storage, key: string): void {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore private-mode storage failures.
    }
  }
}
