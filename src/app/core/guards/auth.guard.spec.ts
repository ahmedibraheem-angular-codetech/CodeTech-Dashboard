import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { authGuard, guestGuard, verifyGuard } from './auth.guard';

describe('auth guards', () => {
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  function run(guard: CanActivateFn): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  const signedIn = () =>
    auth.session.set({ token: 't', email: 'a@b.sa', name: 'A', roleKey: 'roles.editor' });

  it('authGuard sends anonymous users to /login and lets signed-in users through', () => {
    expect(router.serializeUrl(run(authGuard) as UrlTree)).toBe('/login');
    signedIn();
    expect(run(authGuard)).toBe(true);
  });

  it('guestGuard keeps signed-in users away from /login', () => {
    expect(run(guestGuard)).toBe(true);
    signedIn();
    expect(router.serializeUrl(run(guestGuard) as UrlTree)).toBe('/');
  });

  it('verifyGuard requires a pending login and no active session', () => {
    expect(router.serializeUrl(run(verifyGuard) as UrlTree)).toBe('/login');
    auth.pendingEmail.set('a@b.sa');
    expect(run(verifyGuard)).toBe(true);
    signedIn();
    expect(router.serializeUrl(run(verifyGuard) as UrlTree)).toBe('/');
  });
});
