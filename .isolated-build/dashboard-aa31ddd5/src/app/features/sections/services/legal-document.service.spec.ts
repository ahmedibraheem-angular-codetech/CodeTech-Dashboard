import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/config/api';
import { LegalDocumentService } from './legal-document.service';

const TERMS = apiUrl(environment.apiUrl, 'admin/legal-pages/terms');
const PRIVACY = apiUrl(environment.apiUrl, 'admin/legal-pages/privacy');

describe('LegalDocumentService', () => {
  let service: LegalDocumentService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(LegalDocumentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads Terms from GET /admin/legal-pages/terms', async () => {
    const result = firstValueFrom(service.get('terms'));
    const request = http.expectOne(TERMS);
    expect(request.request.method).toBe('GET');
    request.flush({
      data: {
        key: 'terms',
        content: {
          ar: '<h3>شروط</h3><p>نص</p>',
          en: '<h3>Terms</h3><p>Body</p>',
        },
        updated_by: { id: 1, name: 'Admin' },
        updated_at: '2026-10-29T10:00:00.000000Z',
      },
    });
    await expect(result).resolves.toEqual({
      kind: 'terms',
      content: {
        ar: '<h3>شروط</h3><p>نص</p>',
        en: '<h3>Terms</h3><p>Body</p>',
      },
      updatedAt: '2026-10-29T10:00:00.000000Z',
    });
  });

  it('loads Privacy from GET /admin/legal-pages/privacy', async () => {
    const result = firstValueFrom(service.get('privacy'));
    http.expectOne(PRIVACY).flush({
      data: {
        key: 'privacy',
        content: { ar: '<p>خصوصية</p>', en: null },
        updated_by: null,
        updated_at: '2026-10-29T11:00:00.000000Z',
      },
    });
    await expect(result).resolves.toEqual({
      kind: 'privacy',
      content: { ar: '<p>خصوصية</p>', en: '' },
      updatedAt: '2026-10-29T11:00:00.000000Z',
    });
  });

  it('maps empty API content to empty editor strings', async () => {
    const result = firstValueFrom(service.get('terms'));
    http.expectOne(TERMS).flush({
      data: {
        key: 'terms',
        content: { ar: null, en: null },
        updated_by: null,
        updated_at: null,
      },
    });
    await expect(result).resolves.toEqual({
      kind: 'terms',
      content: { ar: '', en: '' },
      updatedAt: null,
    });
  });

  it('saves Arabic and English via PUT with the documented body', async () => {
    const result = firstValueFrom(
      service.save('terms', {
        content: {
          ar: '<p>AR <strong>final</strong></p>',
          en: '<p>EN final</p>',
        },
      }),
    );
    const request = http.expectOne(TERMS);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      content: {
        ar: '<p>AR <strong>final</strong></p>',
        en: '<p>EN final</p>',
      },
    });
    request.flush({
      data: {
        key: 'terms',
        content: {
          ar: '<p>AR <strong>final</strong></p>',
          en: '<p>EN final</p>',
        },
        updated_by: { id: 2, name: 'Editor' },
        updated_at: '2026-11-01T12:00:00.000000Z',
      },
    });
    const saved = await result;
    expect(saved.content.ar).toContain('<strong>final</strong>');
    expect(saved.content.en).toBe('<p>EN final</p>');
  });

  it('sends null English when the English draft has no visible HTML', async () => {
    const result = firstValueFrom(
      service.save('privacy', {
        content: { ar: '<p>AR only</p>', en: '<p><br></p>' },
      }),
    );
    const request = http.expectOne(PRIVACY);
    expect(request.request.body).toEqual({
      content: { ar: '<p>AR only</p>', en: null },
    });
    request.flush({
      data: {
        key: 'privacy',
        content: { ar: '<p>AR only</p>', en: null },
        updated_by: { id: 1, name: 'Admin' },
        updated_at: '2026-11-01T12:00:00.000000Z',
      },
    });
    await expect(result).resolves.toMatchObject({
      kind: 'privacy',
      content: { ar: '<p>AR only</p>', en: '' },
    });
  });

  it('propagates GET failures', async () => {
    const result = firstValueFrom(service.get('terms'));
    http.expectOne(TERMS).flush(
      { message: 'Server error' },
      { status: 500, statusText: 'Server Error' },
    );
    await expect(result).rejects.toBeTruthy();
  });

  it('propagates PUT failures', async () => {
    const result = firstValueFrom(
      service.save('terms', { content: { ar: '<p>a</p>', en: '<p>b</p>' } }),
    );
    http.expectOne(TERMS).flush(
      { message: 'Validation failed' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    await expect(result).rejects.toBeTruthy();
  });

  it('rejects a response whose key does not match the requested document', async () => {
    const result = firstValueFrom(service.get('terms'));
    http.expectOne(TERMS).flush({
      data: {
        key: 'privacy',
        content: { ar: '<p>x</p>', en: null },
        updated_by: null,
        updated_at: null,
      },
    });
    await expect(result).rejects.toThrow(/Unexpected legal page key/);
  });
});
