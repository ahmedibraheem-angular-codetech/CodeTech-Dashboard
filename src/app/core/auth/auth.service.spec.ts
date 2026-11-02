import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API_LATENCY_MS } from '../config/latency';
import { apiUrl } from '../config/api';
import { isApiError } from '../http/api-error';
import type { LoginPayload, ProfileUserDto } from './auth.model';
import { AuthError } from './auth.error';
import { AuthService } from './auth.service';

const BASE = environment.apiUrl;
const LOGIN = apiUrl(BASE, 'admin/auth/login');
const LOGOUT = apiUrl(BASE, 'admin/auth/logout');
const FORGOT = apiUrl(BASE, 'admin/auth/forgot-password');
const VERIFY_CODE = apiUrl(BASE, 'admin/auth/verify-code');
const RESET_PASSWORD = apiUrl(BASE, 'admin/auth/reset-password');
const RESET_TOKEN = 'a'.repeat(64);
const PROFILE = apiUrl(BASE, 'admin/profile');

const LOGIN_BODY: { data: LoginPayload } = {
  data: {
    token: 'api-token',
    user: {
      id: 7,
      code: 'USE-00007',
      name: 'يوسف احمد',
      username: null,
      email: 'admin@codetech-sa.com',
      phone: null,
      status: 'active',
      role: { id: 1, name: 'المدير العام', is_protected: true },
      avatar_url: null,
    },
  },
};

const PROFILE_BODY: { data: ProfileUserDto } = {
  data: {
    id: 7,
    code: 'USE-00007',
    name: 'يوسف احمد',
    username: null,
    email: 'admin@codetech-sa.com',
    phone: '+966 55 000 0000',
    status: 'active',
    role: { id: 1, name: 'المدير العام', is_protected: true },
    avatar: {
      uuid: '9d3b0d2e-6a52-4b84-9a45-2f0c7d1b3e11',
      name: 'avatar',
      file_name: 'avatar.png',
      mime_type: 'image/png',
      size: 320512,
      url: 'https://example.test/avatar.png',
      download_url: 'https://example.test/download',
      created_at: '2026-10-29T10:00:00.000000Z',
    },
    blocked_reason: null,
    blocked_at: null,
    last_login_at: '2026-10-29T09:30:00.000000Z',
    last_activity_at: '2026-10-29T10:12:00.000000Z',
    created_at: '2026-10-20T08:00:00.000000Z',
    updated_at: '2026-10-29T09:30:00.000000Z',
    birth_date: '2000-11-01',
    about: 'نبني حلولاً رقمية',
    permissions: ['products.view', 'products.update', 'users.view'],
  },
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: API_LATENCY_MS, useValue: 0 },
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function login(remember = false, body = LOGIN_BODY): Promise<void> {
    const result = firstValueFrom(service.login('admin@codetech-sa.com', 'Password@123', remember));
    const request = http.expectOne(LOGIN);
    expect(request.request.body).toEqual({
      email: 'admin@codetech-sa.com',
      password: 'Password@123',
      remember,
    });
    request.flush(body);
    const forgot = http.expectOne(FORGOT);
    expect(forgot.request.method).toBe('POST');
    expect(forgot.request.body).toEqual({ email: body.data.user.email });
    forgot.flush({ message: 'ok' });
    await result;
  }

  async function verifyOk(body = PROFILE_BODY, code = '0427'): Promise<void> {
    const result = firstValueFrom(service.verify(code));
    const request = http.expectOne(VERIFY_CODE);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'admin@codetech-sa.com', code });
    request.flush({ message: 'ok' });
    http.expectOne(PROFILE).flush(body);
    await result;
  }

  it('posts the trimmed email to forgot-password', async () => {
    const result = firstValueFrom(service.requestPasswordReset('  anas.elsadany20@gmail.com  '));
    const request = http.expectOne(FORGOT);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'anas.elsadany20@gmail.com' });
    request.flush({ message: 'ok' });
    await result;
    expect(service.isAuthenticated()).toBe(false);
  });

  it('surfaces a forgot-password validation error', async () => {
    const failure = firstValueFrom(service.requestPasswordReset('missing@example.com')).catch(
      (error: unknown) => error,
    );
    http
      .expectOne(FORGOT)
      .flush(
        { message: 'البريد غير مسجل', errors: { email: ['invalid'] } },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    const error = await failure;
    expect(isApiError(error)).toBe(true);
    if (isApiError(error)) {
      expect(error.serverMessage).toBe('البريد غير مسجل');
    }
  });

  it('posts email and code to verify-code and returns the reset token', async () => {
    const result = firstValueFrom(service.verifyResetCode(' admin@codetech.test ', ' 0427 '));
    const request = http.expectOne(VERIFY_CODE);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'admin@codetech.test', code: '0427' });
    request.flush({ data: { reset_token: ` ${RESET_TOKEN} ` } });
    expect(await result).toBe(RESET_TOKEN);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('accepts a top-level reset token from verify-code', async () => {
    const result = firstValueFrom(service.verifyResetCode('admin@codetech.test', '0427'));
    http.expectOne(VERIFY_CODE).flush({ reset_token: RESET_TOKEN });
    expect(await result).toBe(RESET_TOKEN);
  });

  it('rejects a verify-code response that has no reset token', async () => {
    const failure = firstValueFrom(service.verifyResetCode('admin@codetech.test', '0427')).catch(
      (error: unknown) => error,
    );
    http.expectOne(VERIFY_CODE).flush({ message: 'ok' });
    const error = await failure;
    expect(error).toBeInstanceOf(AuthError);
    expect((error as AuthError).code).toBe('unavailable');
  });

  it('posts email, reset token, and the new password', async () => {
    const result = firstValueFrom(
      service.resetPassword(' admin@codetech.test ', RESET_TOKEN, 'NewPassw0rd', 'NewPassw0rd'),
    );
    const request = http.expectOne(RESET_PASSWORD);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'admin@codetech.test',
      reset_token: RESET_TOKEN,
      password: 'NewPassw0rd',
      password_confirmation: 'NewPassw0rd',
    });
    request.flush({ message: 'ok' });
    await result;
    expect(service.isAuthenticated()).toBe(false);
  });

  it('surfaces a reset-password validation error', async () => {
    const failure = firstValueFrom(
      service.resetPassword('admin@codetech.test', RESET_TOKEN, 'bad', 'bad'),
    ).catch((error: unknown) => error);
    http.expectOne(RESET_PASSWORD).flush(
      {
        message: 'كلمة المرور غير صحيحة، حاول مرة اخرى',
        errors: { password: ['كلمة المرور غير صحيحة، حاول مرة اخرى'] },
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    const error = await failure;
    expect(isApiError(error)).toBe(true);
    if (isApiError(error)) {
      expect(error.serverMessage).toBe('كلمة المرور غير صحيحة، حاول مرة اخرى');
    }
  });

  it('treats a rejected verification code as an invalid OTP', async () => {
    const failure = firstValueFrom(service.verifyResetCode('admin@codetech.test', '0000')).catch(
      (error: unknown) => error,
    );
    http
      .expectOne(VERIFY_CODE)
      .flush(
        { message: 'رمز التحقق خاطئ', errors: { code: ['invalid'] } },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    const error = await failure;
    expect(error).toBeInstanceOf(AuthError);
    expect((error as AuthError).code).toBe('invalid-otp');
  });

  it('rejects an incorrect password with a typed error', async () => {
    const failure = firstValueFrom(service.login('admin@codetech-sa.com', 'wrong')).catch(
      (error: unknown) => error,
    );
    http
      .expectOne(LOGIN)
      .flush(
        { message: 'كلمة المرور غير صحيحة، حاول مرة اخرى', errors: { password: ['invalid'] } },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    const error = await failure;
    expect(error).toBeInstanceOf(AuthError);
    expect((error as AuthError).code).toBe('invalid-password');
    expect(service.isAuthenticated()).toBe(false);
    expect(service.hasPendingLogin()).toBe(false);
  });

  it('requests an OTP with forgot-password after a successful login', async () => {
    const result = firstValueFrom(service.login('admin@codetech-sa.com', 'Password@123', false));
    http.expectOne(LOGIN).flush(LOGIN_BODY);
    const forgot = http.expectOne(FORGOT);
    expect(forgot.request.body).toEqual({ email: 'admin@codetech-sa.com' });
    forgot.flush({ message: 'ok' });
    await result;
    expect(service.hasPendingLogin()).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clears pending auth when forgot-password fails after login', async () => {
    const failure = firstValueFrom(
      service.login('admin@codetech-sa.com', 'Password@123', false),
    ).catch((error: unknown) => error);
    http.expectOne(LOGIN).flush(LOGIN_BODY);
    http
      .expectOne(FORGOT)
      .flush({ message: 'تعذر إرسال الرمز' }, { status: 500, statusText: 'Server Error' });
    expect(isApiError(await failure)).toBe(true);
    expect(service.hasPendingLogin()).toBe(false);
  });

  it('resends the login OTP through forgot-password', async () => {
    await login(false);
    const result = firstValueFrom(service.resend());
    const request = http.expectOne(FORGOT);
    expect(request.request.body).toEqual({ email: 'admin@codetech-sa.com' });
    request.flush({ message: 'ok' });
    await result;
  });

  it('keeps the API token pending until the OTP succeeds', async () => {
    await login(false);
    expect(service.hasPendingLogin()).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('codetech.session')).toBeNull();
    expect(localStorage.getItem('codetech.session')).toBeNull();
    expect(sessionStorage.getItem('codetech.pending')).toContain('api-token');
  });

  it('accepts a nullable login username and a login avatar_url string', async () => {
    await login(false, {
      data: {
        token: 'api-token',
        user: {
          ...LOGIN_BODY.data.user,
          username: null,
          avatar_url: 'https://example.test/login-avatar.png',
          phone: '+966 55 111 2222',
        },
      },
    });
    expect(service.hasPendingLogin()).toBe(true);
    expect(JSON.parse(sessionStorage.getItem('codetech.pending')!).name).toBe('يوسف احمد');
  });

  it('opens a session after the correct OTP and GET /profile', async () => {
    await login(false);
    await verifyOk();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.session()?.email).toBe('admin@codetech-sa.com');
    expect(service.session()?.token).toBe('api-token');
    expect(service.hasPendingLogin()).toBe(false);
    expect(sessionStorage.getItem('codetech.session')).toContain('api-token');
    expect(localStorage.getItem('codetech.session')).toBeNull();
  });

  it('uses the Profile response as the canonical auth state after OTP', async () => {
    await login(false);
    await verifyOk();
    const session = service.session();
    expect(session).toMatchObject({
      name: 'يوسف احمد',
      email: 'admin@codetech-sa.com',
      roleKey: 'المدير العام',
      profileLoaded: true,
      avatarUrl: 'https://example.test/avatar.png',
      lastLoginAt: '2026-10-29T09:30:00.000000Z',
      username: null,
      phone: '+966 55 000 0000',
      permissions: ['products.view', 'products.update', 'users.view'],
    });
    expect(service.permissions()).toEqual(['products.view', 'products.update', 'users.view']);
    expect(service.hasPermission('products.view')).toBe(true);
    expect(service.hasPermission('products.delete')).toBe(false);
    expect(service.hasAny(['products.delete', 'users.view'])).toBe(true);
    expect(service.hasAny([])).toBe(false);
    expect(service.hasAll(['products.view', 'users.view'])).toBe(true);
    expect(service.hasAll(['products.view', 'products.delete'])).toBe(false);
    expect(service.hasAll([])).toBe(false);
  });

  it('maps a null profile avatar and empty permissions', async () => {
    await login(false);
    await verifyOk({
      data: {
        ...PROFILE_BODY.data,
        avatar: null,
        permissions: [],
        last_login_at: null,
        username: null,
      },
    });
    expect(service.session()?.avatarUrl).toBeNull();
    expect(service.session()?.permissions).toEqual([]);
    expect(service.session()?.lastLoginAt).toBeNull();
  });

  it('does not treat login as carrying permissions', async () => {
    await login(false);
    expect(service.permissions()).toEqual([]);
    expect(service.session()).toBeNull();
  });

  it('persists only the lean session subset (no permissions or avatar)', async () => {
    await login(true);
    await verifyOk();
    const stored = JSON.parse(localStorage.getItem('codetech.session')!);
    expect(stored).toEqual({
      token: 'api-token',
      email: 'admin@codetech-sa.com',
      name: 'يوسف احمد',
      roleKey: 'المدير العام',
      remember: true,
    });
    expect(stored).not.toHaveProperty('permissions');
    expect(stored).not.toHaveProperty('avatarUrl');
    expect(stored).not.toHaveProperty('lastLoginAt');
  });

  it('rejects a wrong verification code and does not persist the token', async () => {
    await login(false);
    const failure = firstValueFrom(service.verify('9999'));
    http
      .expectOne(VERIFY_CODE)
      .flush(
        { message: 'رمز التحقق خاطئ', errors: { code: ['invalid'] } },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    await expect(failure).rejects.toThrow('invalid-otp');
    expect(service.isAuthenticated()).toBe(false);
    expect(service.hasPendingLogin()).toBe(true);
    expect(sessionStorage.getItem('codetech.session')).toBeNull();
    expect(localStorage.getItem('codetech.session')).toBeNull();
  });

  it('stores the session in localStorage when remember is true', async () => {
    await login(true);
    expect(localStorage.getItem('codetech.session')).toBeNull();
    await verifyOk();
    expect(localStorage.getItem('codetech.session')).toContain('api-token');
    expect(sessionStorage.getItem('codetech.session')).toBeNull();
    expect(service.session()?.remember).toBe(true);
  });

  it('stores the session in sessionStorage when remember is false', async () => {
    await login(false);
    await verifyOk();
    expect(sessionStorage.getItem('codetech.session')).toContain('api-token');
    expect(localStorage.getItem('codetech.session')).toBeNull();
    expect(service.session()?.remember).toBe(false);
  });

  it('never persists the password in web storage', async () => {
    await login(true);
    await verifyOk();
    const dump = (storage: Storage): string =>
      JSON.stringify(Object.fromEntries(Object.entries(storage)));
    expect(dump(sessionStorage)).not.toContain('Password@123');
    expect(dump(localStorage)).not.toContain('Password@123');
  });

  it('clears pending auth when the login flow is cancelled', async () => {
    await login(false);
    service.cancelPending();
    expect(service.hasPendingLogin()).toBe(false);
    expect(sessionStorage.getItem('codetech.pending')).toBeNull();
  });

  it('clears the session on logout and revokes the token', async () => {
    await login(true);
    await verifyOk();
    service.logout();
    expect(service.session()).toBeNull();
    expect(localStorage.getItem('codetech.session')).toBeNull();
    const request = http.expectOne(LOGOUT);
    expect(request.request.headers.get('Authorization')).toBe('Bearer api-token');
    request.flush('', { status: 204, statusText: 'No Content' });
  });

  it('logout clears session and pending keys from both storages', async () => {
    await login(true);
    await verifyOk();
    localStorage.setItem('codetech.pending', JSON.stringify({ token: 'stale' }));
    sessionStorage.setItem('codetech.pending', JSON.stringify({ token: 'stale' }));
    service.logout();
    http.expectOne(LOGOUT).flush('', { status: 204, statusText: 'No Content' });
    expect(localStorage.getItem('codetech.session')).toBeNull();
    expect(sessionStorage.getItem('codetech.session')).toBeNull();
    expect(localStorage.getItem('codetech.pending')).toBeNull();
    expect(sessionStorage.getItem('codetech.pending')).toBeNull();
    expect(service.hasPendingLogin()).toBe(false);
  });

  it('expireSession clears leftover pending auth as well as the session', async () => {
    await login(false);
    await verifyOk();
    sessionStorage.setItem(
      'codetech.pending',
      JSON.stringify({
        token: 'leftover',
        email: 'x@y.sa',
        name: 'X',
        roleKey: 'Editor',
        remember: false,
      }),
    );
    localStorage.setItem('codetech.pending', JSON.stringify({ token: 'leftover' }));
    expect(service.expireSession()).toBe(true);
    expect(service.session()).toBeNull();
    expect(sessionStorage.getItem('codetech.session')).toBeNull();
    expect(localStorage.getItem('codetech.session')).toBeNull();
    expect(sessionStorage.getItem('codetech.pending')).toBeNull();
    expect(localStorage.getItem('codetech.pending')).toBeNull();
  });

  it('still signs the user out when the logout request fails', async () => {
    await login(false);
    await verifyOk();
    service.logout();
    http.expectOne(LOGOUT).flush('nope', { status: 500, statusText: 'Server Error' });
    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('codetech.session')).toBeNull();
  });

  it('does not persist a session when GET /profile fails after OTP', async () => {
    await login(false);
    const failure = firstValueFrom(service.verify('0427')).catch((error: unknown) => error);
    http.expectOne(VERIFY_CODE).flush({ message: 'ok' });
    http.expectOne(PROFILE).flush('gone', { status: 401, statusText: 'Unauthorized' });
    expect(await failure).toBeTruthy();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.hasPendingLogin()).toBe(false);
    expect(sessionStorage.getItem('codetech.session')).toBeNull();
    expect(sessionStorage.getItem('codetech.pending')).toBeNull();
    expect(localStorage.getItem('codetech.pending')).toBeNull();
  });
});

describe('AuthService session restore', () => {
  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  function create(): { service: AuthService; http: HttpTestingController } {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: API_LATENCY_MS, useValue: 0 },
      ],
    });
    return { service: TestBed.inject(AuthService), http: TestBed.inject(HttpTestingController) };
  }

  it('restores a stored session through GET /profile', async () => {
    sessionStorage.setItem(
      'codetech.session',
      JSON.stringify({
        token: 'api-token',
        email: 'admin@codetech-sa.com',
        name: 'قديم',
        roleKey: 'roles.editor',
        remember: false,
      }),
    );
    const { service, http } = create();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.session()?.profileLoaded).toBe(false);
    const ready = firstValueFrom(service.ensureSession());
    http.expectOne(PROFILE).flush(PROFILE_BODY);
    expect(await ready).toBe(true);
    expect(service.session()?.name).toBe('يوسف احمد');
    expect(service.session()?.roleKey).toBe('المدير العام');
    expect(service.session()?.permissions).toContain('users.view');
    expect(service.session()?.profileLoaded).toBe(true);
    http.verify();
  });

  it('clears an expired stored token during restore', async () => {
    sessionStorage.setItem(
      'codetech.session',
      JSON.stringify({
        token: 'dead',
        email: 'a@b.sa',
        name: 'A',
        roleKey: 'roles.editor',
        remember: false,
      }),
    );
    const { service, http } = create();
    const ready = firstValueFrom(service.ensureSession());
    http.expectOne(PROFILE).flush('gone', { status: 401, statusText: 'Unauthorized' });
    expect(await ready).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('codetech.session')).toBeNull();
    http.verify();
  });

  it('reuses one in-flight profile request', async () => {
    localStorage.setItem(
      'codetech.session',
      JSON.stringify({
        token: 'api-token',
        email: 'admin@codetech-sa.com',
        name: 'A',
        roleKey: 'roles.editor',
        remember: true,
      }),
    );
    const { service, http } = create();
    const first = firstValueFrom(service.ensureSession());
    const second = firstValueFrom(service.ensureSession());
    http.expectOne(PROFILE).flush(PROFILE_BODY);
    expect(await first).toBe(true);
    expect(await second).toBe(true);
    expect(await firstValueFrom(service.ensureSession())).toBe(true);
    http.verify();
  });
});
