import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/config/api';
import type { SocialLinkDto } from '../models/social-links.api';
import type { SocialChannelDraft } from '../models/social-links.model';
import { SocialLinksService } from './social-links.service';
import { fromApiPlatform, toApiPlatform, toSocialLinkWrite } from './social-links.mapper';

const LIST = apiUrl(environment.apiUrl, 'admin/social-links');

const linkDto = (id: number, overrides: Partial<SocialLinkDto> = {}): SocialLinkDto => ({
  id,
  platform: 'linkedin',
  url: 'https://www.linkedin.com/company/codetech',
  is_published: true,
  sort_order: id,
  created_at: '2026-10-29T10:00:00.000000Z',
  updated_at: '2026-10-29T10:00:00.000000Z',
  ...overrides,
});

const draft = (overrides: Partial<SocialChannelDraft> = {}): SocialChannelDraft => ({
  platform: 'twitter',
  status: 'published',
  url: 'https://x.com/codetech',
  ...overrides,
});

describe('SocialLinksService', () => {
  let service: SocialLinksService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(SocialLinksService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps UI twitter platform to API x and back', () => {
    expect(toApiPlatform('twitter')).toBe('x');
    expect(fromApiPlatform('x')).toBe('twitter');
    expect(toSocialLinkWrite(draft()).platform).toBe('x');
  });

  it('lists social links and maps is_published to enabled/status', async () => {
    const result = firstValueFrom(service.list());
    const req = http.expectOne(LIST);
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [
        linkDto(1, { platform: 'x', is_published: false, url: 'https://x.com/a' }),
        linkDto(2, { platform: 'whatsapp', url: 'https://wa.me/1' }),
      ],
    });
    const channels = await result;
    expect(channels).toHaveLength(2);
    expect(channels[0]).toMatchObject({
      id: '1',
      platform: 'twitter',
      enabled: false,
      status: 'draft',
      url: 'https://x.com/a',
    });
    expect(channels[1].platform).toBe('whatsapp');
    expect(channels[1].enabled).toBe(true);
    expect(channels[1].status).toBe('published');
  });

  it('creates a channel with platform/url/is_published body', async () => {
    const result = firstValueFrom(service.create(draft({ status: 'draft' })));
    const req = http.expectOne(LIST);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      platform: 'x',
      url: 'https://x.com/codetech',
      is_published: false,
    });
    req.flush({ data: linkDto(9, { platform: 'x', is_published: false }) });
    const channel = await result;
    expect(channel.id).toBe('9');
    expect(channel.platform).toBe('twitter');
    expect(channel.enabled).toBe(false);
  });

  it('updates a channel via PUT', async () => {
    const result = firstValueFrom(
      service.update('3', draft({ platform: 'instagram', url: 'https://instagram.com/c' })),
    );
    const req = http.expectOne(`${LIST}/3`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      platform: 'instagram',
      url: 'https://instagram.com/c',
      is_published: true,
    });
    req.flush({ data: linkDto(3, { platform: 'instagram', url: 'https://instagram.com/c' }) });
    await result;
  });

  it('publishes via PATCH .../publish', async () => {
    const result = firstValueFrom(service.setPublished('7', true));
    const req = http.expectOne(`${LIST}/7/publish`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ is_published: true });
    req.flush({ data: linkDto(7, { is_published: true }) });
    const channel = await result;
    expect(channel.enabled).toBe(true);
    expect(channel.status).toBe('published');
  });

  it('deletes a channel', async () => {
    const result = firstValueFrom(service.remove('4'));
    const req = http.expectOne(`${LIST}/4`);
    expect(req.request.method).toBe('DELETE');
    req.flush('');
    await result;
  });
});
