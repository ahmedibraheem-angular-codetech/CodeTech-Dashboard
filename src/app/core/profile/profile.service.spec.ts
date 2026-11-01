import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { authSession } from '../auth/auth-session.fixture';
import { AuthService } from '../auth/auth.service';
import { apiUrl } from '../config/api';
import { API_LATENCY_MS } from '../config/latency';
import { DEFAULT_AVATAR_URL } from './profile.model';
import { ProfileService } from './profile.service';

const SESSION = authSession({
  token: 't',
  email: 'admin@codetech.sa',
  name: 'أحمد محمد',
  roleKey: 'roles.editor',
  remember: false,
});

describe('ProfileService', () => {
  function create(signedIn = true) {
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
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: API_LATENCY_MS, useValue: 0 },
      ],
    });
    return {
      service: TestBed.inject(ProfileService),
      auth: TestBed.inject(AuthService),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('builds the profile from the session plus the mock details before profile hydrate', () => {
    const { service } = create();
    expect(service.profile()).toMatchObject({
      name: SESSION.name,
      email: SESSION.email,
      roleKey: SESSION.roleKey,
      avatarUrl: DEFAULT_AVATAR_URL,
    });
  });

  it('prefers hydrated auth fields over the mock seed', () => {
    const { service, auth } = create();
    auth.session.set(
      authSession({
        ...SESSION,
        profileLoaded: true,
        roleKey: 'المدير العام',
        avatarUrl: null,
        lastLoginAt: '2026-10-29T09:30:00.000000Z',
        username: null,
        phone: '+966 55 000 0000',
        permissions: ['users.view'],
      }),
    );
    expect(service.profile()).toMatchObject({
      roleKey: 'المدير العام',
      avatarUrl: null,
      lastLogin: '2026-10-29T09:30:00.000000Z',
      username: '',
      phone: '+966 55 000 0000',
    });
  });

  it('is null while signed out', () => {
    expect(create(false).service.profile()).toBeNull();
  });

  it('keeps edits in memory and leaves the session untouched', async () => {
    const { service, auth } = create();
    await firstValueFrom(
      service.update({
        name: 'اسم جديد',
        username: '@new_name',
        email: 'new@codetech.sa',
        phone: '0551234567',
      }),
    );
    expect(service.profile()).toMatchObject({ name: 'اسم جديد', phone: '0551234567' });
    expect(auth.session()?.name).toBe(SESSION.name);
  });

  it('removes the picture, then stores a new one as an object URL', async () => {
    const { service } = create();
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();

    await firstValueFrom(service.removeAvatar());
    expect(service.profile()?.avatarUrl).toBeNull();

    await firstValueFrom(service.setAvatar(new File(['x'], 'me.png', { type: 'image/png' })));
    expect(service.profile()?.avatarUrl).toBe('blob:mock');

    await firstValueFrom(service.removeAvatar());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });

  it('drops edits when the user signs out', async () => {
    const { service, auth, http } = create();
    await firstValueFrom(service.removeAvatar());
    auth.logout();
    http.expectOne(apiUrl(environment.apiUrl, 'admin/auth/logout')).flush('', {
      status: 204,
      statusText: 'No Content',
    });
    TestBed.tick();
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
    auth.session.set(SESSION);
    expect(service.profile()?.avatarUrl).toBe(DEFAULT_AVATAR_URL);
  });
});
