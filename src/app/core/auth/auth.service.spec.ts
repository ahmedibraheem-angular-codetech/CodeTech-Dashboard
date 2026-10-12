import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { DEMO_CREDENTIALS } from '../config/demo-credentials';
import { API_LATENCY_MS } from '../config/latency';
import { AuthError } from './auth.error';
import { AuthService } from './auth.service';

const DEMO = { password: 'test-password', otp: '0000' };

describe('AuthService', () => {
  function create(demo: typeof DEMO | null = DEMO): AuthService {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: API_LATENCY_MS, useValue: 0 },
        { provide: DEMO_CREDENTIALS, useValue: demo },
      ],
    });
    return TestBed.inject(AuthService);
  }

  it('rejects an incorrect password with a typed error', async () => {
    const service = create();
    const failure = await firstValueFrom(service.login('admin@codetech.sa', 'wrong')).catch(
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(AuthError);
    expect((failure as AuthError).code).toBe('invalid-password');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('opens a session after the demo password and code', async () => {
    const service = create();
    await firstValueFrom(service.login('admin@codetech.sa', DEMO.password));
    expect(service.hasPendingLogin()).toBe(true);
    await firstValueFrom(service.verify(DEMO.otp));
    expect(service.isAuthenticated()).toBe(true);
    expect(service.session()?.email).toBe('admin@codetech.sa');
  });

  it('rejects a wrong verification code', async () => {
    const service = create();
    await firstValueFrom(service.login('admin@codetech.sa', DEMO.password));
    await expect(firstValueFrom(service.verify('9999'))).rejects.toThrow('invalid-otp');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('never persists the password in web storage', async () => {
    localStorage.clear();
    const service = create();
    await firstValueFrom(service.login('admin@codetech.sa', DEMO.password));
    await firstValueFrom(service.verify(DEMO.otp));

    const dump = (storage: Storage): string =>
      JSON.stringify(Object.fromEntries(Object.entries(storage)));
    expect(dump(sessionStorage)).not.toContain(DEMO.password);
    expect(dump(localStorage)).not.toContain(DEMO.password);
    expect(localStorage.length).toBe(0);
  });

  it('clears the session on logout', async () => {
    const service = create();
    await firstValueFrom(service.login('admin@codetech.sa', DEMO.password));
    await firstValueFrom(service.verify(DEMO.otp));
    service.logout();
    expect(service.session()).toBeNull();
  });

  it('is unavailable when no demo credentials are configured (production builds)', async () => {
    const service = create(null);
    await expect(firstValueFrom(service.login('admin@codetech.sa', 'anything'))).rejects.toThrow(
      'unavailable',
    );
    expect(service.hasPendingLogin()).toBe(false);
  });
});
