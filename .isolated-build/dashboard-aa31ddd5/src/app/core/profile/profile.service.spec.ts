import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { authSession } from '../auth/auth-session.fixture';
import type { ProfileUserDto } from '../auth/auth.model';
import { AuthService } from '../auth/auth.service';
import { apiUrl } from '../config/api';
import { isApiError } from '../http/api-error';
import { DEFAULT_AVATAR_URL } from './profile.model';
import { ProfileService } from './profile.service';

const BASE = environment.apiUrl;
const PROFILE = apiUrl(BASE, 'admin/profile');
const PASSWORD = apiUrl(BASE, 'admin/profile/password');
const MEDIA = apiUrl(BASE, 'admin/media');

const SESSION = authSession({
  token: 't',
  email: 'admin@codetech.sa',
  name: 'أحمد محمد',
  roleKey: 'roles.editor',
  remember: false,
  profileLoaded: true,
  username: 'admin',
  phone: '+966 55 000 0000',
  avatarUrl: 'https://example.test/avatar.png',
  lastLoginAt: '2026-10-29T09:30:00.000000Z',
  permissions: ['users.view'],
});

function profileDto(overrides: Partial<ProfileUserDto> = {}): ProfileUserDto {
  return {
    id: 7,
    code: 'USE-00007',
    name: 'أحمد محمد',
    username: 'admin',
    email: 'admin@codetech.sa',
    phone: '+966 55 000 0000',
    status: 'active',
    role: { id: 1, name: 'roles.editor', is_protected: false },
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
    last_activity_at: null,
    created_at: '2026-10-20T08:00:00.000000Z',
    updated_at: '2026-10-29T09:30:00.000000Z',
    birth_date: null,
    about: null,
    permissions: ['users.view'],
    ...overrides,
  };
}

describe('ProfileService', () => {
  function create(signedIn = true, hydrated = true) {
    sessionStorage.clear();
    localStorage.clear();
    if (signedIn) {
      sessionStorage.setItem(
        'codetech.session',
        JSON.stringify({
          token: SESSION.token,
          email: SESSION.email,
          name: SESSION.name,
          roleKey: SESSION.roleKey,
          remember: SESSION.remember,
        }),
      );
    }
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    const auth = TestBed.inject(AuthService);
    if (signedIn && hydrated) {
      auth.session.set(SESSION);
    }
    return {
      service: TestBed.inject(ProfileService),
      auth,
      http: TestBed.inject(HttpTestingController),
    };
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('builds the profile from the session plus the mock details before profile hydrate', () => {
    const { service, auth, http } = create(true, false);
    expect(auth.session()?.profileLoaded).toBe(false);
    expect(service.profile()).toMatchObject({
      name: SESSION.name,
      email: SESSION.email,
      roleKey: SESSION.roleKey,
      avatarUrl: DEFAULT_AVATAR_URL,
    });
    http.verify();
  });

  it('prefers hydrated auth fields over the mock seed', () => {
    const { service } = create();
    expect(service.profile()).toMatchObject({
      roleKey: 'roles.editor',
      avatarUrl: 'https://example.test/avatar.png',
      lastLogin: '2026-10-29T09:30:00.000000Z',
      username: '@admin',
      phone: '+966 55 000 0000',
    });
  });

  it('is null while signed out', () => {
    expect(create(false).service.profile()).toBeNull();
  });

  it('puts personal data and syncs the hydrated session without persisting phone or avatar', async () => {
    const { service, auth, http } = create();
    const result = firstValueFrom(
      service.update({
        name: 'اسم جديد',
        username: '@new_name',
        email: 'new@codetech.sa',
        phone: '0551234567',
      }),
    );
    const request = http.expectOne(PROFILE);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      name: 'اسم جديد',
      email: 'new@codetech.sa',
      username: 'new_name',
      phone: '0551234567',
    });
    expect(request.request.body).not.toHaveProperty('avatar');
    request.flush({
      data: profileDto({
        name: 'اسم جديد',
        username: 'new_name',
        email: 'new@codetech.sa',
        phone: '0551234567',
        avatar: null,
      }),
    });
    await result;

    expect(service.profile()).toMatchObject({
      name: 'اسم جديد',
      username: '@new_name',
      email: 'new@codetech.sa',
      phone: '0551234567',
      avatarUrl: null,
    });
    expect(auth.session()).toMatchObject({
      name: 'اسم جديد',
      email: 'new@codetech.sa',
      username: 'new_name',
      phone: '0551234567',
      avatarUrl: null,
      profileLoaded: true,
      token: 't',
    });
    const stored = JSON.parse(sessionStorage.getItem('codetech.session')!);
    expect(stored).toEqual({
      token: 't',
      email: 'new@codetech.sa',
      name: 'اسم جديد',
      roleKey: 'roles.editor',
      remember: false,
    });
    expect(stored).not.toHaveProperty('phone');
    expect(stored).not.toHaveProperty('avatarUrl');
    expect(stored).not.toHaveProperty('username');
  });

  it('surfaces a profile validation error without changing the session', async () => {
    const { service, auth, http } = create();
    const failure = firstValueFrom(
      service.update({
        name: '',
        username: 'admin',
        email: 'admin@codetech.sa',
        phone: '',
      }),
    ).catch((error: unknown) => error);
    http
      .expectOne(PROFILE)
      .flush(
        { message: 'حقل الاسم مطلوب.', errors: { name: ['حقل الاسم مطلوب.'] } },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    const error = await failure;
    expect(isApiError(error)).toBe(true);
    if (isApiError(error)) {
      expect(error.serverMessage).toBe('حقل الاسم مطلوب.');
    }
    expect(auth.session()?.name).toBe(SESSION.name);
  });

  it('changes the password without storing it or touching the session token', async () => {
    const { service, auth, http } = create();
    const result = firstValueFrom(
      service.changePassword('OldPassw0rd', 'NewPassw0rd', 'NewPassw0rd'),
    );
    const request = http.expectOne(PASSWORD);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      current_password: 'OldPassw0rd',
      password: 'NewPassw0rd',
      password_confirmation: 'NewPassw0rd',
    });
    request.flush({ message: 'ok' });
    await result;
    expect(auth.session()?.token).toBe('t');
    expect(JSON.stringify(Object.entries(sessionStorage))).not.toContain('NewPassw0rd');
    expect(JSON.stringify(Object.entries(localStorage))).not.toContain('OldPassw0rd');
  });

  it('surfaces a rejected password change', async () => {
    const { service, http } = create();
    const failure = firstValueFrom(
      service.changePassword('wrong', 'NewPassw0rd', 'NewPassw0rd'),
    ).catch((error: unknown) => error);
    http
      .expectOne(PASSWORD)
      .flush(
        {
          message: 'كلمة المرور غير صحيحة.',
          errors: { current_password: ['كلمة المرور غير صحيحة.'] },
        },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    const error = await failure;
    expect(isApiError(error)).toBe(true);
    if (isApiError(error)) {
      expect(error.serverMessage).toBe('كلمة المرور غير صحيحة.');
    }
  });

  it('uploads an avatar then puts the media uuid on the profile', async () => {
    const { service, auth, http } = create();
    const result = firstValueFrom(
      service.setAvatar(new File(['x'], 'me.png', { type: 'image/png' })),
    );
    const upload = http.expectOne(MEDIA);
    expect(upload.request.method).toBe('POST');
    upload.flush({
      data: {
        uuid: 'fresh-avatar-uuid',
        name: 'me',
        file_name: 'me.png',
        mime_type: 'image/png',
        size: 1,
        url: 'https://example.test/me.png',
        download_url: 'https://example.test/me.png',
        created_at: '2026-11-02T12:00:00.000000Z',
      },
    });
    const put = http.expectOne(PROFILE);
    expect(put.request.body).toEqual({
      name: 'أحمد محمد',
      email: 'admin@codetech.sa',
      username: 'admin',
      phone: '+966 55 000 0000',
      avatar: 'fresh-avatar-uuid',
    });
    put.flush({
      data: profileDto({
        avatar: {
          uuid: 'fresh-avatar-uuid',
          name: 'me',
          file_name: 'me.png',
          mime_type: 'image/png',
          size: 1,
          url: 'https://example.test/me.png',
          download_url: 'https://example.test/me.png',
          created_at: '2026-11-02T12:00:00.000000Z',
        },
      }),
    });
    await result;
    expect(service.profile()?.avatarUrl).toBe('https://example.test/me.png');
    expect(auth.session()?.avatarUrl).toBe('https://example.test/me.png');
    expect(JSON.parse(sessionStorage.getItem('codetech.session')!)).not.toHaveProperty('avatarUrl');
  });

  it('removes the avatar by putting null and syncing the session', async () => {
    const { service, auth, http } = create();
    const result = firstValueFrom(service.removeAvatar());
    const request = http.expectOne(PROFILE);
    expect(request.request.body).toMatchObject({ avatar: null });
    request.flush({ data: profileDto({ avatar: null }) });
    await result;
    expect(service.profile()?.avatarUrl).toBeNull();
    expect(auth.session()?.avatarUrl).toBeNull();
  });
});
