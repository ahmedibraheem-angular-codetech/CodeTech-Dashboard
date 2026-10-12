import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_LATENCY_MS } from '../config/latency';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: API_LATENCY_MS, useValue: 0 }],
    });
    service = TestBed.inject(AuthService);
  });

  it('rejects an incorrect password', async () => {
    await expect(firstValueFrom(service.login('admin@codetech.sa', 'wrong'))).rejects.toThrow('invalid-password');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('opens a session after the demo password and code', async () => {
    await firstValueFrom(service.login('admin@codetech.sa', environment.demoPassword));
    expect(service.hasPendingLogin()).toBe(true);
    await firstValueFrom(service.verify(environment.demoOtp));
    expect(service.isAuthenticated()).toBe(true);
    expect(service.session()?.email).toBe('admin@codetech.sa');
  });

  it('clears the session on logout', async () => {
    await firstValueFrom(service.login('admin@codetech.sa', environment.demoPassword));
    await firstValueFrom(service.verify(environment.demoOtp));
    service.logout();
    expect(service.session()).toBeNull();
  });
});
