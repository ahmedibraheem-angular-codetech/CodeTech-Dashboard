import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  type CanActivateFn,
  type GuardResult,
  Router,
  type RouterStateSnapshot,
  type UrlTree,
  provideRouter,
} from '@angular/router';
import { type Observable, firstValueFrom, isObservable, of } from 'rxjs';

import { authSession } from '../auth/auth-session.fixture';
import { AuthService } from '../auth/auth.service';
import { authGuard, guestGuard, verifyGuard } from './auth.guard';

describe('auth guards', () => {
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  async function run(guard: CanActivateFn): Promise<GuardResult> {
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    return firstValueFrom(isObservable(result) ? (result as Observable<GuardResult>) : of(result));
  }

  const signedIn = () =>
    auth.session.set(
      authSession({
        token: 't',
        email: 'a@b.sa',
        name: 'A',
        roleKey: 'roles.editor',
        remember: false,
        profileLoaded: true,
      }),
    );

  it('authGuard sends anonymous users to /login and lets signed-in users through', async () => {
    expect(router.serializeUrl((await run(authGuard)) as UrlTree)).toBe('/login');
    signedIn();
    expect(await run(authGuard)).toBe(true);
  });

  it('guestGuard keeps signed-in users away from /login', async () => {
    expect(await run(guestGuard)).toBe(true);
    signedIn();
    expect(router.serializeUrl((await run(guestGuard)) as UrlTree)).toBe('/');
  });

  it('verifyGuard requires a pending login and no active session', async () => {
    expect(router.serializeUrl((await run(verifyGuard)) as UrlTree)).toBe('/login');
    auth.pendingEmail.set('a@b.sa');
    expect(await run(verifyGuard)).toBe(true);
    signedIn();
    expect(router.serializeUrl((await run(verifyGuard)) as UrlTree)).toBe('/');
  });

  it('authGuard blocks a pending OTP login from protected routes', async () => {
    auth.pendingEmail.set('a@b.sa');
    expect(auth.isAuthenticated()).toBe(false);
    expect(router.serializeUrl((await run(authGuard)) as UrlTree)).toBe('/login');
  });
});
