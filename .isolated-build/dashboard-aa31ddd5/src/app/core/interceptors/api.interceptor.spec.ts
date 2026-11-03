import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LanguageService } from '../services/language.service';
import { ApiError } from '../http/api-error';
import { apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([apiInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('adds Accept-Language from the active language', () => {
    TestBed.inject(LanguageService).set('en');
    http.get(`${environment.apiUrl}/admin/profile`).subscribe();
    const request = backend.expectOne(`${environment.apiUrl}/admin/profile`);
    expect(request.request.headers.get('Accept-Language')).toBe('en');
    expect(request.request.headers.get('Accept')).toBe('application/json');
    request.flush({ data: {} });
  });

  it('does not decorate third-party requests', () => {
    http.get('https://third-party.example/data').subscribe();
    const request = backend.expectOne('https://third-party.example/data');
    expect(request.request.headers.has('Accept-Language')).toBe(false);
    request.flush({});
  });

  it('normalizes HTTP failures into ApiError', async () => {
    const result = firstValueFrom(http.get(`${environment.apiUrl}/admin/profile`)).catch(
      (error: unknown) => error,
    );
    backend.expectOne(`${environment.apiUrl}/admin/profile`).flush(
      { message: 'تم حظر حسابك.', errors: { email: ['blocked'] } },
      { status: 403, statusText: 'Forbidden' },
    );
    const error = await result;
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('forbidden');
    expect((error as ApiError).serverMessage).toBe('تم حظر حسابك.');
    expect((error as ApiError).fieldErrors['email']).toEqual(['blocked']);
  });
});
