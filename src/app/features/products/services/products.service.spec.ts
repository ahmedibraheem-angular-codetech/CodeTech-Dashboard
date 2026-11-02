import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/config/api';
import type { FileObject } from '../../../core/http/api.model';
import { blankProduct, localeText } from '../models/product.model';
import { ProductsService } from './products.service';

const LIST = apiUrl(environment.apiUrl, 'admin/products');
const PAGE = apiUrl(environment.apiUrl, 'admin/pages/products');
const MEDIA = apiUrl(environment.apiUrl, 'admin/media');

const fileDto = (overrides: Partial<FileObject> = {}): FileObject => ({
  uuid: 'media-1',
  name: 'file',
  file_name: 'file.png',
  mime_type: 'image/png',
  size: 12,
  url: 'https://cdn.test/file.png',
  download_url: 'https://cdn.test/download',
  created_at: '2026-11-01T10:00:00.000000Z',
  ...overrides,
});

const listDto = (id: number) => ({
  id,
  code: `PRD-${`${id}`.padStart(5, '0')}`,
  title: { ar: `منتج ${id}`, en: `Product ${id}` },
  description: { ar: 'وصف', en: 'Desc' },
  short_description: { ar: null, en: null },
  cover: fileDto({ uuid: `cover-${id}` }),
  thumbnail: null,
  features: [],
  status: 'published',
  slug: `product-${id}`,
  sort_order: id,
  created_at: '2026-11-01T10:00:00.000000Z',
  updated_at: '2026-11-01T10:00:00.000000Z',
});

const detailDto = (id: number, overrides: Record<string, unknown> = {}) => ({
  ...listDto(id),
  cover_title: { ar: '', en: '' },
  cover_alt: { ar: '', en: '' },
  thumbnail_title: { ar: '', en: '' },
  thumbnail_alt: { ar: '', en: '' },
  solution_title: { ar: '', en: '' },
  solution_description: { ar: '', en: '' },
  solution_image: null,
  stats: [],
  sectors: [{ id: 31, image: { ar: fileDto({ uuid: 'sec-1' }), en: null } }],
  challenges: [],
  offerings: [],
  results: [],
  advantages: [],
  integrations: [],
  modules: [],
  workflow_steps: [],
  identity_items: [],
  reasons: [],
  faqs: [],
  meta_title: { ar: '', en: '' },
  meta_keywords: { ar: [], en: [] },
  meta_description: { ar: '', en: '' },
  ...overrides,
});

describe('ProductsService (HTTP)', () => {
  let service: ProductsService;
  let http: HttpTestingController;

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

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lists paginated products', async () => {
    const result = firstValueFrom(service.list({ perPage: 10 }));
    const req = await expectRequest(`${LIST}?per_page=10`);
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [listDto(7)],
      links: { first: null, last: null, prev: null, next: null },
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        path: LIST,
        per_page: 10,
        to: 1,
        total: 1,
      },
    });
    expect((await result)[0]?.id).toBe('7');
  });

  it('loads detail with bilingual sectors', async () => {
    const result = firstValueFrom(service.get('7'));
    const req = await expectRequest(`${LIST}/7`);
    req.flush({ data: detailDto(7) });
    const product = await result;
    expect(product?.sectors[0]?.image.ar.imageUuid).toBe('sec-1');
  });

  it('creates a product with mapped write body', async () => {
    const draft = {
      ...blankProduct(),
      name: localeText('منتج', 'Product'),
      summary: localeText('وصف', 'Desc'),
      features: [],
      stats: [],
      sectors: [],
      challenges: [],
      offer: [],
      results: [],
      tools: [],
      integrations: [],
      units: [],
      steps: [],
      identity: [],
      faqs: [],
      highlights: [],
    };
    const result = firstValueFrom(service.save(draft));
    const req = await expectRequest(LIST);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toEqual({ ar: 'منتج', en: 'Product' });
    expect(req.request.body).not.toHaveProperty('category');
    req.flush({ data: detailDto(9) });
    expect((await result).id).toBe('9');
  });

  it('uploads blob media then PUTs coat-check UUID', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Blob(['x'], { type: 'image/png' }), { status: 200 })),
    );
    const draft = {
      ...blankProduct(),
      id: '7',
      name: localeText('منتج', 'Product'),
      summary: localeText('وصف', 'Desc'),
      features: [
        {
          id: 'feat-new',
          title: localeText('ميزة', 'Feature'),
          body: localeText('سطر', 'Line'),
          imageName: 'f.png',
          imageUrl: 'blob:https://local/feature',
          imageUuid: null,
        },
      ],
      stats: [],
      sectors: [],
      challenges: [],
      offer: [],
      results: [],
      tools: [],
      integrations: [],
      units: [],
      steps: [],
      identity: [],
      faqs: [],
      highlights: [],
    };
    const result = firstValueFrom(service.save(draft));
    const upload = await expectRequest(MEDIA);
    expect(upload.request.method).toBe('POST');
    upload.flush({ data: fileDto({ uuid: 'uploaded-feat' }) });
    const put = await expectRequest(`${LIST}/7`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.features[0].icon).toBe('uploaded-feat');
    put.flush({ data: detailDto(7) });
    await result;
    vi.unstubAllGlobals();
  });

  it('publishes through the status endpoint', async () => {
    const result = firstValueFrom(service.setPublished('7', false));
    const req = await expectRequest(`${LIST}/7/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'draft' });
    req.flush({ data: detailDto(7, { status: 'draft' }) });
    expect((await result).published).toBe(false);
  });

  it('loads catalog visibility from the products page', async () => {
    const result = firstValueFrom(service.loadCatalogVisibility());
    const req = await expectRequest(PAGE);
    req.flush({
      data: {
        sections: {
          features_enabled: true,
          sectors_enabled: true,
          products_visible: true,
        },
        features: [],
        sectors: [],
      },
    });
    expect(await result).toBe(true);
    expect(service.catalogVisible()).toBe(true);
  });
});
