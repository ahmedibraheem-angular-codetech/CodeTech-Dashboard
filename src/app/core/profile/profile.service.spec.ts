import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { API_LATENCY_MS } from '../config/latency';
import { DEFAULT_AVATAR_URL } from './profile.model';
import { ProfileService } from './profile.service';

const SESSION = {
  token: 't',
  email: 'admin@codetech.sa',
  name: 'أحمد محمد',
  roleKey: 'roles.editor',
};

describe('ProfileService', () => {
  function create(signedIn = true) {
    sessionStorage.clear();
    if (signedIn) {
      sessionStorage.setItem('codetech.session', JSON.stringify(SESSION));
    }
    TestBed.configureTestingModule({ providers: [{ provide: API_LATENCY_MS, useValue: 0 }] });
    return { service: TestBed.inject(ProfileService), auth: TestBed.inject(AuthService) };
  }

  it('builds the profile from the session plus the mock details', () => {
    const { service } = create();
    expect(service.profile()).toMatchObject({
      name: SESSION.name,
      email: SESSION.email,
      roleKey: SESSION.roleKey,
      avatarUrl: DEFAULT_AVATAR_URL,
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
    const { service, auth } = create();
    await firstValueFrom(service.removeAvatar());
    auth.logout();
    TestBed.tick();
    sessionStorage.setItem('codetech.session', JSON.stringify(SESSION));
    auth.session.set(SESSION);
    expect(service.profile()?.avatarUrl).toBe(DEFAULT_AVATAR_URL);
  });
});
