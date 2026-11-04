import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/config/api';
import type { FileObject } from '../../../core/http/api.model';
import {
  CategoryInUseError,
  blankArticle,
  type ArticleDraft,
  type ArticleMediaDraft,
} from '../models/knowledge.model';
import { KnowledgeService } from './knowledge.service';

const CATEGORIES = apiUrl(environment.apiUrl, 'admin/article-categories');
const ARTICLES = apiUrl(environment.apiUrl, 'admin/articles');
const MEDIA = apiUrl(environment.apiUrl, 'admin/media');
const STATS = apiUrl(environment.apiUrl, 'admin/articles/stats');
const EXPORT = apiUrl(environment.apiUrl, 'admin/articles/export');

const fileDto = (overrides: Partial<FileObject> = {}): FileObject => ({
  uuid: 'media-1',
  name: 'cover',
  file_name: 'cover.png',
  mime_type: 'image/png',
  size: 12,
  url: 'https://cdn.test/cover.png',
  download_url: 'https://cdn.test/download',
  created_at: '2026-11-01T10:00:00.000000Z',
  ...overrides,
});

const categoryDto = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  name: { ar: `تصنيف ${id}`, en: `Category ${id}` },
  is_published: true,
  sort_order: id,
  articles_count: 0,
  created_at: '2026-11-01T09:00:00.000000Z',
  updated_at: '2026-11-01T09:00:00.000000Z',
  ...overrides,
});

const listArticle = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  code: `ART-${`${id}`.padStart(4, '0')}`,
  title: { ar: `عنوان ${id}`, en: `Title ${id}` },
  excerpt: { ar: `مقتطف ${id}`, en: `Excerpt ${id}` },
  category: { id: 2, name: { ar: 'تقنية', en: 'Tech' } },
  thumbnail: fileDto({ uuid: `thumb-${id}`, url: `https://cdn.test/t-${id}.png` }),
  reading_time_minutes: 5,
  status: 'published',
  is_scheduled: false,
  is_featured: false,
  published_at: '2026-11-01T12:00:00.000000Z',
  created_at: '2026-11-01T10:00:00.000000Z',
  updated_at: '2026-11-01T10:00:00.000000Z',
  ...overrides,
});

const detailArticle = (id: number, overrides: Record<string, unknown> = {}) => ({
  ...listArticle(id),
  content: { ar: '<p>محتوى</p>', en: '<p>Content</p>' },
  author_name: { ar: 'مؤلف', en: 'Author' },
  author_photo: fileDto({ uuid: 'author-1', url: 'https://cdn.test/author.png' }),
  thumbnail_title: { ar: 'مصغر', en: 'Thumb' },
  thumbnail_alt: { ar: 'وصف', en: 'Alt' },
  cover: fileDto({ uuid: 'cover-1' }),
  cover_title: { ar: 'غلاف', en: 'Cover' },
  cover_alt: { ar: 'غلاف وصف', en: 'Cover alt' },
  meta_title: { ar: 'سيو', en: 'SEO' },
  slug: 'demo-article',
  meta_keywords: { ar: ['معرفة', 'تقنية'], en: ['knowledge', 'tech'] },
  meta_description: { ar: 'وصف سيو', en: 'SEO desc' },
  ...overrides,
});

const page = (items: unknown[], pageNum: number, lastPage: number) => ({
  data: items,
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: pageNum,
    from: 1,
    last_page: lastPage,
    path: ARTICLES,
    per_page: 100,
    to: items.length,
    total: items.length,
  },
});

const draft = (overrides: Partial<ArticleDraft> = {}): ArticleDraft => ({
  ...blankArticle(),
  titleAr: 'عنوان',
  titleEn: 'Title',
  excerptAr: 'مقتطف',
  excerptEn: 'Excerpt',
  contentAr: '<p>عربي</p>',
  contentEn: '<p>English</p>',
  categoryId: '2',
  status: 'draft',
  ...overrides,
});

const omitMedia = (): ArticleMediaDraft => ({
  cover: { kind: 'omit' },
  thumbnail: { kind: 'omit' },
  authorPhoto: { kind: 'omit' },
});

describe('KnowledgeService', () => {
  let service: KnowledgeService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(KnowledgeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists categories and maps bilingual fields', async () => {
    const result = firstValueFrom(service.listCategories());
    http.expectOne(CATEGORIES).flush({
      data: [categoryDto(9, { articles_count: 3, is_published: false })],
    });
    const categories = await result;
    expect(categories).toEqual([
      expect.objectContaining({
        id: '9',
        nameAr: 'تصنيف 9',
        nameEn: 'Category 9',
        published: false,
        articleCount: 3,
        order: 9,
      }),
    ]);
  });

  it('creates, updates, publishes and deletes categories', async () => {
    const created = firstValueFrom(
      service.createCategory({ nameAr: 'جديد', nameEn: 'New', published: true }),
    );
    const post = http.expectOne(CATEGORIES);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      name: { ar: 'جديد', en: 'New' },
      is_published: true,
    });
    post.flush({ data: categoryDto(10, { name: { ar: 'جديد', en: 'New' } }) });
    expect((await created).id).toBe('10');

    const updated = firstValueFrom(
      service.updateCategory('10', { nameAr: 'محدث', nameEn: 'Updated', published: false }),
    );
    const put = http.expectOne(`${CATEGORIES}/10`);
    expect(put.request.method).toBe('PUT');
    put.flush({
      data: categoryDto(10, {
        name: { ar: 'محدث', en: 'Updated' },
        is_published: false,
      }),
    });
    expect((await updated).published).toBe(false);

    const published = firstValueFrom(service.setCategoryPublished('10', true));
    const patch = http.expectOne(`${CATEGORIES}/10/publish`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ is_published: true });
    patch.flush({ data: categoryDto(10, { is_published: true }) });
    expect((await published).published).toBe(true);

    const removed = firstValueFrom(service.removeCategory('10'));
    const del = http.expectOne(`${CATEGORIES}/10`);
    expect(del.request.method).toBe('DELETE');
    del.flush('');
    await removed;
  });

  it('maps category-in-use delete conflicts', async () => {
    const removed = firstValueFrom(service.removeCategory('2'));
    http
      .expectOne(`${CATEGORIES}/2`)
      .flush({ message: 'Category still has articles' }, { status: 409, statusText: 'Conflict' });
    await expect(removed).rejects.toBeInstanceOf(CategoryInUseError);
  });

  it('lists articles across paginated pages', async () => {
    const result = firstValueFrom(service.list());
    const page1 = http.expectOne((req) => req.url === ARTICLES && req.params.get('page') === '1');
    expect(page1.request.params.get('per_page')).toBe('100');
    page1.flush(page([listArticle(1)], 1, 2));
    const page2 = http.expectOne((req) => req.url === ARTICLES && req.params.get('page') === '2');
    page2.flush(page([listArticle(2, { status: 'draft', is_featured: true })], 2, 2));
    const articles = await result;
    expect(articles).toHaveLength(2);
    expect(articles[0]).toMatchObject({
      id: '1',
      code: 'ART-0001',
      titleAr: 'عنوان 1',
      categoryId: '2',
      status: 'published',
      thumbnailUrl: 'https://cdn.test/t-1.png',
    });
    expect(articles[1]).toMatchObject({ id: '2', status: 'draft', featured: true });
  });

  it('applies search and filter query params', async () => {
    const result = firstValueFrom(
      service.listPage({
        page: 1,
        perPage: 20,
        search: 'AI',
        status: 'draft',
        categoryId: '4',
        featured: true,
        from: '2026-01-01',
        to: '2026-12-31',
      }),
    );
    const req = http.expectOne((r) => r.url === ARTICLES);
    expect(req.request.params.get('search')).toBe('AI');
    expect(req.request.params.get('filter[status]')).toBe('draft');
    expect(req.request.params.get('filter[category]')).toBe('4');
    expect(req.request.params.get('filter[featured]')).toBe('1');
    expect(req.request.params.get('filter[from]')).toBe('2026-01-01');
    expect(req.request.params.get('filter[to]')).toBe('2026-12-31');
    req.flush(page([], 1, 1));
    await result;
  });

  it('loads article details with bilingual SEO and media', async () => {
    const result = firstValueFrom(service.get('15'));
    http.expectOne(`${ARTICLES}/15`).flush({ data: detailArticle(15) });
    const article = await result;
    expect(article).toMatchObject({
      id: '15',
      contentAr: '<p>محتوى</p>',
      contentEn: '<p>Content</p>',
      slug: 'demo-article',
      seoTitleAr: 'سيو',
      seoTitleEn: 'SEO',
      seoKeywordsAr: 'معرفة, تقنية',
      seoKeywordsEn: 'knowledge, tech',
      seoDescriptionAr: 'وصف سيو',
      coverUrl: 'https://cdn.test/cover.png',
      authorAvatarUrl: 'https://cdn.test/author.png',
      cover: expect.objectContaining({ uuid: 'cover-1' }),
    });
  });

  it('returns null for missing article details', async () => {
    const result = firstValueFrom(service.get('404'));
    http
      .expectOne(`${ARTICLES}/404`)
      .flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    expect(await result).toBeNull();
  });

  it('creates an article with bilingual payload and omits unchanged media', async () => {
    const result = firstValueFrom(service.create(draft(), omitMedia()));
    const req = http.expectOne(ARTICLES);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(
      expect.objectContaining({
        status: 'draft',
        article_category_id: 2,
        title: { ar: 'عنوان', en: 'Title' },
        excerpt: { ar: 'مقتطف', en: 'Excerpt' },
        content: { ar: '<p>عربي</p>', en: '<p>English</p>' },
        slug: null,
        meta_title: { ar: '', en: '' },
        meta_keywords: { ar: [], en: [] },
      }),
    );
    expect(req.request.body.cover).toBeUndefined();
    expect(req.request.body.thumbnail).toBeUndefined();
    expect(req.request.body.author_photo).toBeUndefined();
    req.flush({ data: detailArticle(20, { status: 'draft' }) });
    expect((await result).id).toBe('20');
  });

  it('uploads replacement media as UUIDs and can clear slots', async () => {
    const file = new File(['x'], 'cover.png', { type: 'image/png' });
    const result = firstValueFrom(
      service.update('15', draft({ status: 'published' }), {
        cover: { kind: 'replace', file },
        thumbnail: { kind: 'clear' },
        authorPhoto: { kind: 'omit' },
      }),
    );

    const upload = http.expectOne(MEDIA);
    expect(upload.request.method).toBe('POST');
    upload.flush({ data: fileDto({ uuid: 'uploaded-cover' }) });

    const put = http.expectOne(`${ARTICLES}/15`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.cover).toBe('uploaded-cover');
    expect(put.request.body.thumbnail).toBeNull();
    expect(put.request.body.author_photo).toBeUndefined();
    put.flush({ data: detailArticle(15) });
    expect((await result).id).toBe('15');
  });

  it('patches status and featured state', async () => {
    const status = firstValueFrom(service.setStatus('15', 'unpublished'));
    const statusReq = http.expectOne(`${ARTICLES}/15/status`);
    expect(statusReq.request.body).toEqual({ status: 'unpublished' });
    statusReq.flush({ data: detailArticle(15, { status: 'unpublished' }) });
    expect((await status).status).toBe('unpublished');

    const featured = firstValueFrom(service.setFeatured('15', true));
    const featureReq = http.expectOne(`${ARTICLES}/15/feature`);
    expect(featureReq.request.body).toEqual({ is_featured: true });
    featureReq.flush({ data: detailArticle(15, { is_featured: true }) });
    expect((await featured).featured).toBe(true);
  });

  it('deletes articles and exports CSV', async () => {
    const removed = firstValueFrom(service.remove('15'));
    http.expectOne(`${ARTICLES}/15`).flush('');
    await removed;

    const blob = firstValueFrom(service.exportCsv());
    const exportReq = http.expectOne(EXPORT);
    expect(exportReq.request.responseType).toBe('blob');
    exportReq.flush(new Blob(['id\n'], { type: 'text/csv' }));
    expect(await blob).toBeInstanceOf(Blob);
  });

  it('loads article statistics', async () => {
    const result = firstValueFrom(service.stats());
    http.expectOne(STATS).flush({
      data: {
        total: { value: 12, previous: null, change_pct: 4.5 },
        published: { value: 7, previous: null, change_pct: null },
        featured: { value: 3, previous: null, change_pct: 1.2 },
        unpublished: { value: 2, previous: null, change_pct: -3 },
      },
    });
    expect(await result).toEqual({
      total: 12,
      published: 7,
      featured: 3,
      unpublished: 2,
      totalChangePct: 4.5,
      publishedChangePct: null,
      featuredChangePct: 1.2,
      unpublishedChangePct: -3,
    });
  });
});
