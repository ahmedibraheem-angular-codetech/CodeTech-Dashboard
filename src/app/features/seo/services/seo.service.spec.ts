import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/config/api';
import type { FileObject } from '../../../core/http/api.model';
import { SeoService } from './seo.service';

const LIST = apiUrl(environment.apiUrl, 'admin/seo');
const MEDIA = apiUrl(environment.apiUrl, 'admin/media');

const file = (overrides: Partial<FileObject> = {}): FileObject => ({
  uuid: 'thumb-1',
  name: 'share',
  file_name: 'share.png',
  mime_type: 'image/png',
  size: 10,
  url: 'https://cdn.test/share.png',
  download_url: 'https://cdn.test/download',
  created_at: '2026-11-01T10:00:00.000000Z',
  ...overrides,
});

const page = (key: string, overrides: Record<string, unknown> = {}) => ({
  page: key,
  meta_title: { ar: `${key}-ar`, en: `${key}-en` },
  slug: key === 'knowledge_center' ? 'knowledge-center' : key === 'global' ? 'site' : key,
  meta_keywords: { ar: ['عربية'], en: ['english'] },
  meta_description: { ar: 'وصف', en: 'desc' },
  thumbnail: file({ uuid: `${key}-thumb` }),
  thumbnail_title: { ar: 'عنوان', en: 'Title' },
  thumbnail_alt: { ar: 'بديل', en: 'Alt' },
  updated_by: { id: 1, name: 'Admin' },
  updated_at: '2026-11-01T10:00:00.000000Z',
  ...overrides,
});

describe('SeoService', () => {
  let service: SeoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(SeoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the overview and maps tab ids including global and knowledge_center', async () => {
    const result = firstValueFrom(service.loadAll());
    const req = http.expectOne(LIST);
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [
        page('global'),
        page('home'),
        page('knowledge_center', { slug: 'knowledge-center' }),
      ],
    });
    const catalog = await result;
    expect(catalog.seo.ar.metaTitle).toBe('global-ar');
    expect(catalog.home.en.metaTitle).toBe('home-en');
    expect(catalog.knowledge.ar.slug).toBe('knowledge-center');
    expect(catalog.knowledge.en.slug).toBe('knowledge-center');
    expect(catalog.about.ar.metaTitle).toBe('');
    expect(service.content('seo', 'en').metaTitle).toBe('global-en');
  });

  it('loads one page without overwriting sibling drafts', async () => {
    const all = firstValueFrom(service.loadAll());
    http.expectOne(LIST).flush({
      data: [page('global'), page('home', { meta_title: { ar: 'رئيسية', en: 'Home' } })],
    });
    await all;

    service.patch('home', 'ar', { metaTitle: 'محلي فقط' });
    const one = firstValueFrom(service.loadPage('seo'));
    const req = http.expectOne(`${LIST}/global`);
    expect(req.request.method).toBe('GET');
    req.flush({
      data: page('global', { meta_title: { ar: 'محدث', en: 'Updated' } }),
    });
    await one;

    expect(service.content('seo', 'ar').metaTitle).toBe('محدث');
    expect(service.content('home', 'ar').metaTitle).toBe('محلي فقط');
  });

  it('saves the active tab to its API key and keeps both languages', async () => {
    const all = firstValueFrom(service.loadAll());
    http.expectOne(LIST).flush({ data: [page('knowledge_center')] });
    await all;

    service.patch('knowledge', 'en', { metaTitle: 'Knowledge EN', description: 'New desc' });
    service.patch('knowledge', 'ar', { metaTitle: 'معرفة', keywords: 'أ, ب' });

    const saved = firstValueFrom(service.save('knowledge'));
    const put = http.expectOne(`${LIST}/knowledge_center`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toMatchObject({
      meta_title: { ar: 'معرفة', en: 'Knowledge EN' },
      slug: 'knowledge-center',
      meta_keywords: { ar: ['أ', 'ب'], en: ['english'] },
      meta_description: { ar: 'وصف', en: 'New desc' },
    });
    expect(put.request.body).not.toHaveProperty('thumbnail');
    put.flush({
      data: page('knowledge_center', {
        meta_title: { ar: 'معرفة', en: 'Knowledge EN' },
        meta_description: { ar: 'وصف', en: 'New desc' },
      }),
    });
    await expect(saved).resolves.toMatchObject({
      ar: expect.objectContaining({ metaTitle: 'معرفة' }),
      en: expect.objectContaining({ metaTitle: 'Knowledge EN' }),
    });
    expect(service.dirty('knowledge')).toBe(false);
  });

  it('uploads a thumbnail then PUTs its UUID (never a display URL)', async () => {
    const all = firstValueFrom(service.loadAll());
    http.expectOne(LIST).flush({ data: [page('home')] });
    await all;

    const image = new File(['img'], 'og.png', { type: 'image/png' });
    service.setThumbnail('home', image, 'blob:preview');
    expect(service.dirty('home')).toBe(true);
    expect(service.content('home', 'ar').thumbUrl).toBe('blob:preview');
    expect(service.content('home', 'en').thumbUrl).toBe('blob:preview');

    const saved = firstValueFrom(service.save('home'));
    const upload = http.expectOne(MEDIA);
    expect(upload.request.method).toBe('POST');
    const body = upload.request.body as FormData;
    expect(body.get('type')).toBe('image');
    upload.flush({ data: file({ uuid: 'uploaded-thumb' }) });

    const put = http.expectOne(`${LIST}/home`);
    expect(put.request.body.thumbnail).toBe('uploaded-thumb');
    expect(put.request.body.thumbnail).not.toContain('http');
    expect(put.request.body.thumbnail).not.toContain('blob:');
    put.flush({
      data: page('home', { thumbnail: file({ uuid: 'uploaded-thumb' }) }),
    });
    await saved;
    expect(service.content('home', 'ar').thumbUrl).toContain('cdn.test');
    expect(service.dirty('home')).toBe(false);
  });

  it('preserves thumbnail on save when unchanged (omit key)', async () => {
    const all = firstValueFrom(service.loadAll());
    http.expectOne(LIST).flush({ data: [page('about')] });
    await all;

    service.patch('about', 'ar', { thumbTitle: 'جديد' });
    const saved = firstValueFrom(service.save('about'));
    const put = http.expectOne(`${LIST}/about`);
    expect(put.request.body).not.toHaveProperty('thumbnail');
    put.flush({ data: page('about', { thumbnail_title: { ar: 'جديد', en: 'Title' } }) });
    await saved;
  });

  it('syncs slug across locales and sends a single slug field', async () => {
    const all = firstValueFrom(service.loadAll());
    http.expectOne(LIST).flush({ data: [page('products', { slug: 'products' })] });
    await all;

    service.patch('products', 'en', { slug: 'our-products' });
    expect(service.content('products', 'ar').slug).toBe('our-products');
    expect(service.content('products', 'en').slug).toBe('our-products');

    const saved = firstValueFrom(service.save('products'));
    const put = http.expectOne(`${LIST}/products`);
    expect(put.request.body.slug).toBe('our-products');
    put.flush({ data: page('products', { slug: 'our-products' }) });
    await saved;
  });

  it('reverts local edits for one page only', async () => {
    const all = firstValueFrom(service.loadAll());
    http.expectOne(LIST).flush({
      data: [page('services'), page('projects', { meta_title: { ar: 'مشاريع', en: 'Projects' } })],
    });
    await all;

    service.patch('services', 'ar', { metaTitle: 'مسودة' });
    service.patch('projects', 'en', { metaTitle: 'Draft' });
    expect(service.dirty('services')).toBe(true);

    service.revert('services');
    expect(service.content('services', 'ar').metaTitle).toBe('services-ar');
    expect(service.dirty('services')).toBe(false);
    expect(service.content('projects', 'en').metaTitle).toBe('Draft');
  });

  it('surfaces overview HTTP errors', async () => {
    const result = firstValueFrom(service.loadAll()).catch((error: unknown) => error);
    http.expectOne(LIST).flush('nope', { status: 500, statusText: 'Server Error' });
    expect(await result).toBeTruthy();
  });

  it('surfaces media upload failures before PUT', async () => {
    const all = firstValueFrom(service.loadAll());
    http.expectOne(LIST).flush({ data: [page('home')] });
    await all;

    service.setThumbnail('home', new File(['x'], 'x.png', { type: 'image/png' }), 'blob:x');
    const result = firstValueFrom(service.save('home')).catch((error: unknown) => error);
    http.expectOne(MEDIA).flush('fail', { status: 422, statusText: 'Unprocessable' });
    expect(await result).toBeTruthy();
    http.expectNone(`${LIST}/home`);
  });
});
