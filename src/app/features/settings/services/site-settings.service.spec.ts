import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/config/api';
import type { FileObject } from '../../../core/http/api.model';
import type { SiteSettingsDto } from '../models/site-settings.api';
import type { SiteSettingsDraft } from '../models/site-settings.model';
import { SiteSettingsService } from './site-settings.service';

const SITE = apiUrl(environment.apiUrl, 'admin/site-settings');
const MEDIA = apiUrl(environment.apiUrl, 'admin/media');

const logoDto = (overrides: Partial<FileObject> = {}): FileObject => ({
  uuid: 'logo-uuid-1',
  name: 'logo',
  file_name: 'logo.png',
  mime_type: 'image/png',
  size: 1200,
  url: 'https://cdn.test/logo.png',
  download_url: 'https://cdn.test/download',
  created_at: '2026-10-29T10:00:00.000000Z',
  ...overrides,
});

const siteDto = (overrides: Partial<SiteSettingsDto> = {}): SiteSettingsDto => ({
  site_description: {
    ar: 'نبني حلولاً رقمية',
    en: 'We build digital solutions for CodeTech',
  },
  company_name: { ar: 'كود التقنية', en: 'CodeTech' },
  location_name: { ar: 'الرياض', en: 'Kingdom of Saudi Arabia' },
  phone: '+966 50 000 0000',
  email: 'info@code-tech.sa',
  website_url: 'https://code-tech.sa',
  google_maps_url: 'https://maps.app.goo.gl/abc',
  logo: logoDto(),
  updated_by: { id: 1, name: 'Admin' },
  updated_at: '2026-10-29T10:00:00.000000Z',
  ...overrides,
});

const draft = (overrides: Partial<SiteSettingsDraft> = {}): SiteSettingsDraft => ({
  description: { ar: 'وصف عربي', en: 'English description' },
  companyName: { ar: 'كود التقنية', en: 'CodeTech' },
  websiteUrl: 'https://code-tech.sa',
  phone: '+966 55 111 2222',
  email: 'hello@code-tech.sa',
  locationName: { ar: 'الرياض', en: 'Riyadh' },
  mapUrl: 'https://maps.app.goo.gl/xyz',
  logo: { kind: 'omit' },
  ...overrides,
});

describe('SiteSettingsService', () => {
  let service: SiteSettingsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(SiteSettingsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads bilingual site settings and logo', async () => {
    const result = firstValueFrom(service.get());
    const req = http.expectOne(SITE);
    expect(req.request.method).toBe('GET');
    req.flush({ data: siteDto() });
    const site = await result;
    expect(site.description.en).toContain('CodeTech');
    expect(site.companyName.ar).toBe('كود التقنية');
    expect(site.locationName.en).toBe('Kingdom of Saudi Arabia');
    expect(site.logo.uuid).toBe('logo-uuid-1');
    expect(site.logo.url).toBe('https://cdn.test/logo.png');
  });

  it('saves bilingual fields and omits logo when unchanged', async () => {
    const result = firstValueFrom(service.save(draft()));
    const req = http.expectOne(SITE);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      site_description: { ar: 'وصف عربي', en: 'English description' },
      company_name: { ar: 'كود التقنية', en: 'CodeTech' },
      location_name: { ar: 'الرياض', en: 'Riyadh' },
      phone: '+966 55 111 2222',
      email: 'hello@code-tech.sa',
      website_url: 'https://code-tech.sa',
      google_maps_url: 'https://maps.app.goo.gl/xyz',
    });
    expect(req.request.body).not.toHaveProperty('logo');
    req.flush({ data: siteDto() });
    await result;
  });

  it('uploads a new logo then sends its UUID', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'fresh.png', { type: 'image/png' });
    const result = firstValueFrom(service.save(draft({ logo: { kind: 'replace', file } })));

    const media = http.expectOne(MEDIA);
    expect(media.request.method).toBe('POST');
    media.flush({ data: logoDto({ uuid: 'new-logo', file_name: 'fresh.png' }) });

    const put = http.expectOne(SITE);
    expect(put.request.body.logo).toBe('new-logo');
    put.flush({ data: siteDto({ logo: logoDto({ uuid: 'new-logo', file_name: 'fresh.png' }) }) });

    const saved = await result;
    expect(saved.logo.uuid).toBe('new-logo');
  });

  it('sends logo null when clearing', async () => {
    const result = firstValueFrom(service.save(draft({ logo: { kind: 'clear' } })));
    const req = http.expectOne(SITE);
    expect(req.request.body.logo).toBeNull();
    req.flush({ data: siteDto({ logo: null }) });
    const saved = await result;
    expect(saved.logo.uuid).toBeNull();
  });
});
