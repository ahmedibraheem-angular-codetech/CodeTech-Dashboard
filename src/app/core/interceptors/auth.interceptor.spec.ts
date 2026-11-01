import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { authSession } from '../auth/auth-session.fixture';
import { AuthService } from '../auth/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    auth.session.set(
      authSession({
        token: 'secret-token',
        email: 'a@b.sa',
        name: 'A',
        roleKey: 'roles.editor',
        remember: false,
        profileLoaded: true,
      }),
    );
  });

  afterEach(() => backend.verify());

  it('adds the bearer token to API requests', () => {
    http.get(`${environment.apiUrl}/users`).subscribe();
    const request = backend.expectOne(`${environment.apiUrl}/users`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer secret-token');
    request.flush([]);
  });

  it('does not send the token when the session has none', () => {
    auth.session.set(null);
    http.get(`${environment.apiUrl}/users`).subscribe();
    const request = backend.expectOne(`${environment.apiUrl}/users`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });

  it('does not send a pending login token', () => {
    auth.session.set(null);
    auth.pendingEmail.set('a@b.sa');
    http.get(`${environment.apiUrl}/users`).subscribe();
    const request = backend.expectOne(`${environment.apiUrl}/users`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });

  it('does not send the token to other origins', () => {
    http.get('https://third-party.example/data').subscribe();
    const request = backend.expectOne('https://third-party.example/data');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('does not treat lookalike paths as API requests', () => {
    http.get(`${environment.apiUrl}-other/data`).subscribe();
    const request = backend.expectOne(`${environment.apiUrl}-other/data`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('leaves an existing Authorization header alone', () => {
    http
      .get(`${environment.apiUrl}/admin/auth/logout`, {
        headers: { Authorization: 'Bearer pending-token' },
      })
      .subscribe();
    const request = backend.expectOne(`${environment.apiUrl}/admin/auth/logout`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer pending-token');
    request.flush('');
  });

  it('signs the user out and redirects to /login on 401', async () => {
    sessionStorage.setItem(
      'codetech.pending',
      JSON.stringify({
        token: 'leftover',
        email: 'a@b.sa',
        name: 'A',
        roleKey: 'Editor',
        remember: false,
      }),
    );
    localStorage.setItem('codetech.pending', JSON.stringify({ token: 'leftover' }));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const result = firstValueFrom(http.get(`${environment.apiUrl}/users`)).catch(
      (error: unknown) => error,
    );
    backend
      .expectOne(`${environment.apiUrl}/users`)
      .flush('nope', { status: 401, statusText: 'Unauthorized' });
    await result;
    expect(auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('codetech.session')).toBeNull();
    expect(localStorage.getItem('codetech.session')).toBeNull();
    expect(sessionStorage.getItem('codetech.pending')).toBeNull();
    expect(localStorage.getItem('codetech.pending')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
