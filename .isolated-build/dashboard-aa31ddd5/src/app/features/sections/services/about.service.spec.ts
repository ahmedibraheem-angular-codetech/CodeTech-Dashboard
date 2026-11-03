import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/config/api';
import { AboutService } from './about.service';
import { ABOUT_PAGE_DTO, ABOUT_PARTNERS_DTO } from './about.mock';

const ABOUT = apiUrl(environment.apiUrl, 'admin/pages/about');
const PARTNERS = apiUrl(environment.apiUrl, 'admin/partners');
const TEAM = apiUrl(environment.apiUrl, 'admin/team-members');
const MEDIA = apiUrl(environment.apiUrl, 'admin/media');

describe('AboutService', () => {
  let service: AboutService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(AboutService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushLoad(): void {
    http.expectOne(ABOUT).flush({ data: ABOUT_PAGE_DTO });
    http.expectOne(PARTNERS).flush({ data: ABOUT_PARTNERS_DTO });
  }

  it('loads the about page together with partners', async () => {
    const result = firstValueFrom(service.load());
    flushLoad();
    const content = await result;
    expect(content.story.texts.ar[0].title).toBe('فلسفة الشركة');
    expect(content.partners).toHaveLength(2);
    expect(content.team[0].texts.ar.name).toBe('سارة محمد');
    expect(content.team[0].texts.en.name).toBe('Sara Mohamed');
    expect(content.ceo.image?.url).toContain('ceo.png');
  });

  it('saves the about block with a new image uuid', async () => {
    const file = new File(['x'], 'shot.png', { type: 'image/png' });
    const content = firstValueFrom(service.load());
    flushLoad();
    const loaded = await content;
    const story = {
      ...loaded.story,
      image: { name: 'shot.png', size: 1, uploadedAt: '2026-11-01', file },
    };
    const result = firstValueFrom(service.saveStory(story, loaded.story.image));
    http.expectOne(MEDIA).flush({
      data: {
        uuid: 'img-9',
        name: 'shot',
        file_name: 'shot.png',
        mime_type: 'image/png',
        size: 1,
        url: 'https://example.test/shot.png',
        download_url: 'https://example.test/download',
        created_at: '2026-11-01T10:00:00.000000Z',
      },
    });
    const put = http.expectOne(`${ABOUT}/about-block`);
    expect(put.request.body.image).toBe('img-9');
    expect(put.request.body.philosophy_points.ar).toContain('الجودة أولاً');
    put.flush({ data: ABOUT_PAGE_DTO });
    await expect(result).resolves.toMatchObject({
      image: expect.objectContaining({ uuid: 'about-image' }),
    });
  });

  it('saves vision and mission quotes and points', async () => {
    const content = firstValueFrom(service.load());
    flushLoad();
    const loaded = await content;
    const result = firstValueFrom(service.saveVision(loaded.vision));
    const put = http.expectOne(`${ABOUT}/vision-mission`);
    expect(put.request.body.vision_quote.ar).toBe('نحو مستقبل رقمي');
    put.flush({ data: ABOUT_PAGE_DTO });
    await expect(result).resolves.toMatchObject({
      texts: { ar: expect.any(Array) },
    });
  });

  it('creates a team member with nullable English fields', async () => {
    const result = firstValueFrom(
      service.saveMember(
        {
          id: 'new',
          texts: {
            ar: { name: 'نورة', role: 'محللة' },
            en: { name: '', role: '' },
          },
          image: null,
        },
        null,
      ),
    );
    const post = http.expectOne(TEAM);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      name: { ar: 'نورة', en: null },
      job_title: { ar: 'محللة', en: null },
    });
    post.flush(
      {
        data: {
          id: 99,
          name: { ar: 'نورة', en: null },
          job_title: { ar: 'محللة', en: null },
          photo: null,
          sort_order: 3,
          created_at: '2026-11-01T10:00:00.000000Z',
          updated_at: '2026-11-01T10:00:00.000000Z',
        },
      },
      { status: 201, statusText: 'Created' },
    );
    await expect(result).resolves.toMatchObject({
      id: '99',
      texts: {
        ar: { name: 'نورة', role: 'محللة' },
        en: { name: '', role: '' },
      },
    });
  });

  it('updates a team member without erasing English or replacing the photo', async () => {
    const result = firstValueFrom(
      service.saveMember(
        {
          id: '1',
          texts: {
            ar: { name: 'سارة م.', role: 'مصممة' },
            en: { name: 'Sara Mohamed', role: 'UI designer' },
          },
          image: {
            name: 'sara.png',
            size: 1,
            uploadedAt: '2026-10-29',
            uuid: 'team-1',
            url: 'https://example.test/sara.png',
          },
        },
        {
          name: 'sara.png',
          size: 1,
          uploadedAt: '2026-10-29',
          uuid: 'team-1',
          url: 'https://example.test/sara.png',
        },
      ),
    );
    const put = http.expectOne(`${TEAM}/1`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({
      name: { ar: 'سارة م.', en: 'Sara Mohamed' },
      job_title: { ar: 'مصممة', en: 'UI designer' },
    });
    expect(put.request.body).not.toHaveProperty('photo');
    put.flush({
      data: {
        id: 1,
        name: { ar: 'سارة م.', en: 'Sara Mohamed' },
        job_title: { ar: 'مصممة', en: 'UI designer' },
        photo: {
          uuid: 'team-1',
          name: 'sara',
          file_name: 'sara.png',
          mime_type: 'image/png',
          size: 1,
          url: 'https://example.test/sara.png',
          download_url: 'https://example.test/download',
          created_at: '2026-10-29T10:00:00.000000Z',
        },
        sort_order: 1,
        created_at: '2026-10-29T10:00:00.000000Z',
        updated_at: '2026-11-01T10:00:00.000000Z',
      },
    });
    await expect(result).resolves.toMatchObject({
      id: '1',
      texts: {
        ar: { name: 'سارة م.', role: 'مصممة' },
        en: { name: 'Sara Mohamed', role: 'UI designer' },
      },
      image: expect.objectContaining({ uuid: 'team-1' }),
    });
  });

  it('uploads a partner logo then POSTs /admin/partners', async () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    const result = firstValueFrom(
      service.savePartner({
        id: 'new',
        name: 'logo',
        monogram: 'l',
        image: { name: 'logo.png', size: 1, uploadedAt: '2026-11-01', file },
      }),
    );
    http.expectOne(MEDIA).flush({
      data: {
        uuid: 'logo-9',
        name: 'logo',
        file_name: 'logo.png',
        mime_type: 'image/png',
        size: 1,
        url: 'https://example.test/logo.png',
        download_url: 'https://example.test/download',
        created_at: '2026-11-01T10:00:00.000000Z',
      },
    });
    const post = http.expectOne(PARTNERS);
    expect(post.request.body).toEqual({ logo: 'logo-9' });
    post.flush({
      data: {
        id: 44,
        logo: {
          uuid: 'logo-9',
          name: 'logo',
          file_name: 'logo.png',
          mime_type: 'image/png',
          size: 1,
          url: 'https://example.test/logo.png',
          download_url: 'https://example.test/download',
          created_at: '2026-11-01T10:00:00.000000Z',
        },
        sort_order: 1,
        created_at: '2026-11-01T10:00:00.000000Z',
        updated_at: '2026-11-01T10:00:00.000000Z',
      },
    });
    await expect(result).resolves.toMatchObject({ id: '44', name: 'logo.png' });
  });

  it('surfaces HTTP errors from load', async () => {
    const result = firstValueFrom(service.load()).catch((error: unknown) => error);
    http.expectOne(ABOUT).flush('nope', { status: 500, statusText: 'Server Error' });

    http.expectOne(PARTNERS);
    expect(await result).toBeTruthy();
  });
});
