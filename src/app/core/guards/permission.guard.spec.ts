import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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

import { environment } from '../../../environments/environment';
import { apiUrl } from '../config/api';
import { authSession } from '../auth/auth-session.fixture';
import type { ProfileUserDto } from '../auth/auth.model';
import { AuthService } from '../auth/auth.service';
import { permissionGuard } from './permission.guard';

const PROFILE = apiUrl(environment.apiUrl, 'admin/profile');

const PROFILE_BODY: { data: ProfileUserDto } = {
  data: {
    id: 7,
    code: 'USE-00007',
    name: 'User',
    username: null,
    email: 'a@b.sa',
    phone: null,
    status: 'active',
    role: { id: 1, name: 'Editor', is_protected: false },
    avatar: null,
    blocked_reason: null,
    blocked_at: null,
    last_login_at: null,
    last_activity_at: null,
    created_at: '2026-10-20T08:00:00.000000Z',
    updated_at: '2026-10-29T09:30:00.000000Z',
    birth_date: null,
    about: null,
    permissions: ['products.view', 'products.update'],
  },
};

describe('permissionGuard', () => {
  let auth: AuthService;
  let router: Router;
  let http: HttpTestingController;

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
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function run(
    guard: CanActivateFn,
    data: Record<string, unknown> = {},
  ): Promise<GuardResult> {
    const route = { data } as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() =>
      guard(route, {} as RouterStateSnapshot),
    );
    return firstValueFrom(isObservable(result) ? (result as Observable<GuardResult>) : of(result));
  }

  function pathOf(result: GuardResult): string {
    return router.serializeUrl(result as UrlTree);
  }

  it('allows a signed-in user who holds the required permission (factory)', async () => {
    auth.session.set(
      authSession({
        token: 't',
        email: 'a@b.sa',
        name: 'A',
        profileLoaded: true,
        permissions: ['products.view'],
      }),
    );
    expect(await run(permissionGuard('products.view'))).toBe(true);
  });

  it('allows when route.data.permission matches', async () => {
    auth.session.set(
      authSession({
        token: 't',
        email: 'a@b.sa',
        name: 'A',
        profileLoaded: true,
        permissions: ['users.view'],
      }),
    );
    expect(await run(permissionGuard(), { permission: 'users.view' })).toBe(true);
  });

  it('allows when all route.data.permissions are held', async () => {
    auth.session.set(
      authSession({
        token: 't',
        email: 'a@b.sa',
        name: 'A',
        profileLoaded: true,
        permissions: ['products.view', 'products.update'],
      }),
    );
    expect(
      await run(permissionGuard(), { permissions: ['products.view', 'products.update'] }),
    ).toBe(true);
  });

  it('sends anonymous users to /login', async () => {
    expect(pathOf(await run(permissionGuard('products.view')))).toBe('/login');
  });

  it('sends signed-in users without the grant to /forbidden', async () => {
    auth.session.set(
      authSession({
        token: 't',
        email: 'a@b.sa',
        name: 'A',
        profileLoaded: true,
        permissions: ['users.view'],
      }),
    );
    expect(pathOf(await run(permissionGuard('products.view')))).toBe('/forbidden');
  });

  it('denies when permissions are empty after a loaded profile', async () => {
    auth.session.set(
      authSession({
        token: 't',
        email: 'a@b.sa',
        name: 'A',
        profileLoaded: true,
        permissions: [],
      }),
    );
    expect(pathOf(await run(permissionGuard('products.view')))).toBe('/forbidden');
  });

  it('denies when no permission is configured (safe default)', async () => {
    auth.session.set(
      authSession({
        token: 't',
        email: 'a@b.sa',
        name: 'A',
        profileLoaded: true,
        permissions: ['products.view'],
      }),
    );
    expect(pathOf(await run(permissionGuard()))).toBe('/forbidden');
  });

  it('waits for ensureSession so unloaded permissions are not treated as empty grants', async () => {
    sessionStorage.setItem(
      'codetech.session',
      JSON.stringify({
        token: 'api-token',
        email: 'a@b.sa',
        name: 'A',
        roleKey: 'Editor',
        remember: false,
      }),
    );
    auth.session.set(
      authSession({
        token: 'api-token',
        email: 'a@b.sa',
        name: 'A',
        roleKey: 'Editor',
        remember: false,
        profileLoaded: false,
        permissions: [],
      }),
    );

    const pending = run(permissionGuard('products.view'));
    const request = http.expectOne(PROFILE);
    request.flush(PROFILE_BODY);
    expect(await pending).toBe(true);
    expect(auth.permissions()).toEqual(['products.view', 'products.update']);
  });

  it('sends the user to /login when profile restore fails (session cleared)', async () => {
    sessionStorage.setItem(
      'codetech.session',
      JSON.stringify({
        token: 'dead',
        email: 'a@b.sa',
        name: 'A',
        roleKey: 'Editor',
        remember: false,
      }),
    );
    auth.session.set(
      authSession({
        token: 'dead',
        email: 'a@b.sa',
        name: 'A',
        roleKey: 'Editor',
        remember: false,
        profileLoaded: false,
        permissions: [],
      }),
    );

    const pending = run(permissionGuard('products.view'));
    http.expectOne(PROFILE).flush('gone', { status: 401, statusText: 'Unauthorized' });
    expect(pathOf(await pending)).toBe('/login');
    expect(auth.session()).toBeNull();
  });

  it('does not redirect /forbidden to itself (no permission check on that target)', async () => {
    auth.session.set(
      authSession({
        token: 't',
        email: 'a@b.sa',
        name: 'A',
        profileLoaded: true,
        permissions: [],
      }),
    );
    const denied = pathOf(await run(permissionGuard('products.view')));
    expect(denied).toBe('/forbidden');

    expect(denied).not.toBe('/login');
  });

  it('prefers the factory argument over route.data', async () => {
    auth.session.set(
      authSession({
        token: 't',
        email: 'a@b.sa',
        name: 'A',
        profileLoaded: true,
        permissions: ['products.view'],
      }),
    );
    expect(
      pathOf(await run(permissionGuard('users.view'), { permission: 'products.view' })),
    ).toBe('/forbidden');
  });
});
