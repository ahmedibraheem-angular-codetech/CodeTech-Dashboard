import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/config/api';
import type { FileObject } from '../../../core/http/api.model';
import { blankService, localeText } from '../models/service.model';
import { ServicesService } from './services.service';

const LIST = apiUrl(environment.apiUrl, 'admin/services');
const MEDIA = apiUrl(environment.apiUrl, 'admin/media');

const fileDto = (overrides: Partial<FileObject> = {}): FileObject => ({
  uuid: 'media-1',
  name: 'icon',
  file_name: 'icon.png',
  mime_type: 'image/png',
  size: 12,
  url: 'https://cdn.test/icon.png',
  download_url: 'https://cdn.test/download',
  created_at: '2026-11-01T10:00:00.000000Z',
  ...overrides,
});

const listDto = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  code: `SRV-${`${id}`.padStart(5, '0')}`,
  name: { ar: `خدمة ${id}`, en: `Service ${id}` },
  description: { ar: 'وصف', en: 'Desc' },
  icon: fileDto({ uuid: `icon-${id}` }),
  status: 'published',
  slug: `service-${id}`,
  sort_order: id,
  created_at: '2026-11-01T10:00:00.000000Z',
  updated_at: '2026-11-01T10:00:00.000000Z',
  ...overrides,
});

const detailDto = (id: number, overrides: Record<string, unknown> = {}) => ({
  ...listDto(id),
  why_image: fileDto({ uuid: 'why-1', url: 'https://cdn.test/why.png' }),
  why_image_text: { ar: 'نص', en: 'Caption' },
  needs: [
    {
      id: 11,
      title: { ar: 'حاجة', en: 'Need' },
      icon: fileDto({ uuid: 'need-1' }),
      sort_order: 1,
    },
  ],
  solutions: [
    {
      id: 21,
      title: { ar: 'حل', en: 'Solution' },
      short_description: { ar: 'سطر', en: 'Line' },
      icon: fileDto({ uuid: 'sol-1' }),
      sort_order: 1,
    },
  ],
  stages: [
    {
      id: 31,
      title: { ar: 'مرحلة', en: 'Stage' },
      short_description: { ar: 'وصف', en: 'Body' },
      image: fileDto({ uuid: 'stage-1' }),
      sort_order: 1,
    },
  ],
  features: [
    {
      id: 41,
      title: { ar: 'ميزة', en: 'Feature' },
      short_description: { ar: 'نص', en: 'Text' },
      image: null,
      sort_order: 1,
    },
  ],
  sectors: [
    {
      id: 51,
      image: { ar: fileDto({ uuid: 'sector-1' }), en: null },
      sort_order: 1,
    },
  ],
  faqs: [
    {
      id: 61,
      question: { ar: 'سؤال؟', en: 'Question?' },
      answer: { ar: 'جواب', en: 'Answer' },
      sort_order: 1,
    },
  ],
  projects: [
    {
      id: 3,
      title: { ar: 'مشروع', en: 'Project' },
      description: { ar: 'وصف مشروع', en: 'Project desc' },
      cover: fileDto({ uuid: 'cover-1' }),
      status: 'published',
      is_visible: true,
      sort_order: 1,
    },
  ],
  ...overrides,
});

describe('ServicesService', () => {
  let service: ServicesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(ServicesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  async function expectRequest(url: string) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const matches = http.match(url);
      if (matches.length === 1) {
        return matches[0];
      }
      if (matches.length > 1) {
        return http.expectOne(url);
      }
      await Promise.resolve();
    }
    return http.expectOne(url);
  }

  it('lists services without pagination and maps bilingual fields', async () => {
    const result = firstValueFrom(service.list());
    const req = http.expectOne(LIST);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [listDto(4, { status: 'draft' }), listDto(5)] });
    const items = await result;
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: '4',
      code: 'SRV-00004',
      published: false,
      name: { ar: 'خدمة 4', en: 'Service 4' },
      iconUrl: 'https://cdn.test/icon.png',
      iconUuid: 'icon-4',
    });
  });

  it('loads detail with embedded FAQs, sectors and linked projects', async () => {
    const result = firstValueFrom(service.get('4'));
    http.expectOne(`${LIST}/4`).flush({ data: detailDto(4) });
    const item = await result;
    expect(item).toMatchObject({
      id: '4',
      whyImage: expect.objectContaining({ imageUuid: 'why-1', title: { ar: 'نص', en: 'Caption' } }),
      whyItems: [expect.objectContaining({ id: '11', title: { ar: 'حاجة', en: 'Need' } })],
      solutions: [expect.objectContaining({ body: { ar: 'سطر', en: 'Line' } })],
      stages: [expect.objectContaining({ imageUuid: 'stage-1' })],
      features: [expect.objectContaining({ id: '41', imageUrl: '' })],
      sectors: [
        expect.objectContaining({
          image: expect.objectContaining({
            ar: expect.objectContaining({ imageUuid: 'sector-1' }),
            en: expect.objectContaining({ imageUuid: null }),
          }),
        }),
      ],
      faqs: [expect.objectContaining({ id: '61' })],
      projectIds: ['3'],
      linkedProjects: [expect.objectContaining({ id: '3', visible: true })],
    });
  });

  it('returns null for missing services', async () => {
    const result = firstValueFrom(service.get('404'));
    http.expectOne(`${LIST}/404`).flush(
      { message: 'Not found' },
      { status: 404, statusText: 'Not Found' },
    );
    expect(await result).toBeNull();
  });

  it('creates a service with bilingual payload, embedded FAQs and project refs', async () => {
    const draft = {
      ...blankService(),
      name: localeText('خدمة', 'Service'),
      description: localeText('وصف', 'Desc'),
      published: true,
      whyItems: [
        {
          id: 'why-local',
          title: localeText('حاجة', 'Need'),
          imageName: '',
          imageUrl: '',
          imageUuid: null,
        },
      ],
      faqs: [
        {
          id: 'faq-local',
          question: localeText('س؟', 'Q?'),
          answer: localeText('ج', 'A'),
        },
      ],
      projectIds: ['3', 'not-a-number'],
      solutions: [],
      stages: [],
      features: [],
      sectors: [],
    };
    const result = firstValueFrom(service.save(draft));
    const req = await expectRequest(LIST);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(
      expect.objectContaining({
        status: 'published',
        name: { ar: 'خدمة', en: 'Service' },
        needs: [expect.objectContaining({ title: { ar: 'حاجة', en: 'Need' } })],
        faqs: [expect.objectContaining({ question: { ar: 'س؟', en: 'Q?' } })],
        projects: [{ id: 3, is_visible: true }],
      }),
    );
    expect(req.request.body.needs[0].id).toBeUndefined();
    req.flush({ data: detailDto(9) }, { status: 201, statusText: 'Created' });
    expect((await result).id).toBe('9');
  });

  it('updates an existing service and preserves media UUIDs', async () => {
    const current = {
      ...blankService(),
      id: '4',
      name: localeText('خدمة', 'Service'),
      description: localeText('وصف', 'Desc'),
      published: false,
      whyImage: {
        title: localeText('نص', 'Caption'),
        imageName: 'why.png',
        imageUrl: 'https://cdn.test/why.png',
        imageUuid: 'why-1',
      },
      whyItems: [
        {
          id: '11',
          title: localeText('حاجة', 'Need'),
          imageName: 'n.png',
          imageUrl: 'https://cdn.test/n.png',
          imageUuid: 'need-1',
        },
      ],
      solutions: [],
      stages: [],
      features: [],
      sectors: [
        {
          id: '51',
          image: {
            ar: {
              imageName: 's.png',
              imageUrl: 'https://cdn.test/s.png',
              imageUuid: 'sector-1',
            },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
      faqs: [],
      projectIds: ['3'],
    };
    const result = firstValueFrom(service.save(current));
    const req = await expectRequest(`${LIST}/4`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.status).toBe('draft');
    expect(req.request.body.why_image).toBe('why-1');
    expect(req.request.body.needs[0]).toEqual(
      expect.objectContaining({ id: 11, icon: 'need-1' }),
    );
    expect(req.request.body.sectors[0]).toEqual(
      expect.objectContaining({ id: 51, image: { ar: 'sector-1', en: null } }),
    );
    req.flush({ data: detailDto(4, { status: 'draft' }) });
    expect((await result).published).toBe(false);
  });

  it('uploads blob media through MediaService before create', async () => {
    const blobUrl = 'blob:https://local/test-image';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Blob(['x'], { type: 'image/png' }), { status: 200 })),
    );
    const draft = {
      ...blankService(),
      name: localeText('خدمة', 'Service'),
      description: localeText('وصف عربي كافٍ', 'Desc'),
      published: true,
      whyImage: {
        title: localeText('نص', 'Caption'),
        imageName: 'hero.png',
        imageUrl: blobUrl,
        imageUuid: null,
      },
      whyItems: [],
      solutions: [],
      stages: [],
      features: [],
      sectors: [],
      faqs: [],
      projectIds: [],
    };
    const result = firstValueFrom(service.save(draft));
    const upload = await expectRequest(MEDIA);
    expect(upload.request.method).toBe('POST');
    upload.flush({ data: fileDto({ uuid: 'uploaded-why' }) });
    const post = await expectRequest(LIST);
    expect(post.request.body.why_image).toBe('uploaded-why');
    post.flush({ data: detailDto(12) }, { status: 201, statusText: 'Created' });
    expect((await result).id).toBe('12');
    vi.unstubAllGlobals();
  });

  it('patches publish status and deletes a service', async () => {
    const published = firstValueFrom(service.setPublished('4', true));
    const patch = http.expectOne(`${LIST}/4/status`);
    expect(patch.request.body).toEqual({ status: 'published' });
    patch.flush({ data: detailDto(4, { status: 'published' }) });
    expect((await published).published).toBe(true);

    const removed = firstValueFrom(service.remove('4'));
    http.expectOne(`${LIST}/4`).flush('');
    await removed;
  });

  it('toggles linked project visibility', async () => {
    const result = firstValueFrom(service.setProjectVisible('4', '3', false));
    const req = http.expectOne(`${LIST}/4/projects/3`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ is_visible: false });
    req.flush({
      data: {
        id: 3,
        title: { ar: 'مشروع', en: 'Project' },
        description: { ar: '', en: '' },
        cover: null,
        status: 'published',
        is_visible: false,
        sort_order: 1,
      },
    });
    expect((await result).is_visible).toBe(false);
  });
});
