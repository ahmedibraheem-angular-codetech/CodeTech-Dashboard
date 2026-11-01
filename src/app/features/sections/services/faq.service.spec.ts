import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/config/api';
import { FaqService } from './faq.service';

const CATEGORIES = apiUrl(environment.apiUrl, 'admin/faq-categories');
const FAQS = apiUrl(environment.apiUrl, 'admin/faqs');

describe('FaqService', () => {
  let service: FaqService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(FaqService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists categories from GET /admin/faq-categories', async () => {
    const result = firstValueFrom(service.listCategories());
    const request = http.expectOne(CATEGORIES);
    expect(request.request.method).toBe('GET');
    request.flush({
      data: [
        {
          id: 1,
          name: { ar: 'عام', en: 'General' },
          is_published: true,
          sort_order: 1,
          faqs_count: 2,
          created_at: '2026-10-29T10:00:00.000000Z',
          updated_at: '2026-10-29T10:00:00.000000Z',
        },
      ],
    });
    await expect(result).resolves.toEqual([
      {
        id: '1',
        name: { ar: 'عام', en: 'General' },
        order: 1,
        published: true,
        code: '000001',
        createdAt: '2026-10-29T10:00:00.000000Z',
        faqsCount: 2,
      },
    ]);
  });

  it('lists FAQs across paginated pages', async () => {
    const result = firstValueFrom(service.list());
    const page1 = http.expectOne((req) => req.url === FAQS && req.params.get('page') === '1');
    expect(page1.request.params.get('per_page')).toBe('100');
    page1.flush({
      data: [
        {
          id: 1,
          category: { id: 1, name: { ar: 'عام', en: 'General' } },
          question: { ar: 'س1', en: 'Q1' },
          answer: { ar: 'ج1', en: 'A1' },
          is_published: true,
          sort_order: 1,
          created_at: '2026-10-29T10:00:00.000000Z',
          updated_at: '2026-10-29T10:00:00.000000Z',
        },
      ],
      links: { first: null, last: null, prev: null, next: null },
      meta: {
        current_page: 1,
        from: 1,
        last_page: 2,
        path: FAQS,
        per_page: 100,
        to: 1,
        total: 2,
      },
    });
    const page2 = http.expectOne((req) => req.url === FAQS && req.params.get('page') === '2');
    page2.flush({
      data: [
        {
          id: 2,
          category: { id: 1, name: { ar: 'عام', en: 'General' } },
          question: { ar: 'س2', en: 'Q2' },
          answer: { ar: 'ج2', en: 'A2' },
          is_published: false,
          sort_order: 2,
          created_at: '2026-10-29T10:00:00.000000Z',
          updated_at: '2026-10-29T10:00:00.000000Z',
        },
      ],
      links: { first: null, last: null, prev: null, next: null },
      meta: {
        current_page: 2,
        from: 2,
        last_page: 2,
        path: FAQS,
        per_page: 100,
        to: 2,
        total: 2,
      },
    });
    const items = await result;
    expect(items.map((item) => item.id)).toEqual(['1', '2']);
    expect(items[1]?.categoryId).toBe('1');
  });

  it('creates and updates a category', async () => {
    const create = firstValueFrom(
      service.createCategory({
        name: { ar: 'جديد', en: 'New' },
        published: true,
        order: 1,
        code: 'x',
        createdAt: '2026-01-01',
      }),
    );
    const post = http.expectOne(CATEGORIES);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      name: { ar: 'جديد', en: 'New' },
      is_published: true,
    });
    post.flush({
      data: {
        id: 9,
        name: { ar: 'جديد', en: 'New' },
        is_published: true,
        sort_order: 3,
        faqs_count: 0,
        created_at: '2026-11-01T10:00:00.000000Z',
        updated_at: '2026-11-01T10:00:00.000000Z',
      },
    });
    await expect(create).resolves.toMatchObject({ id: '9', name: { ar: 'جديد', en: 'New' } });

    const update = firstValueFrom(
      service.updateCategory('9', {
        name: { ar: 'محدث', en: 'Updated' },
        published: false,
        order: 3,
        code: '000009',
        createdAt: '2026-11-01T10:00:00.000000Z',
      }),
    );
    const put = http.expectOne(`${CATEGORIES}/9`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({
      name: { ar: 'محدث', en: 'Updated' },
      is_published: false,
    });
    put.flush({
      data: {
        id: 9,
        name: { ar: 'محدث', en: 'Updated' },
        is_published: false,
        sort_order: 3,
        faqs_count: 0,
        created_at: '2026-11-01T10:00:00.000000Z',
        updated_at: '2026-11-01T11:00:00.000000Z',
      },
    });
    await expect(update).resolves.toMatchObject({ published: false, name: { ar: 'محدث', en: 'Updated' } });
  });

  it('publishes a category via PATCH …/publish, not PUT', async () => {
    const result = firstValueFrom(service.setCategoryPublished('3', true));
    const request = http.expectOne(`${CATEGORIES}/3/publish`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ is_published: true });
    request.flush({
      data: {
        id: 3,
        name: { ar: 'عام', en: 'General' },
        is_published: true,
        sort_order: 1,
        faqs_count: 1,
        created_at: '2026-10-29T10:00:00.000000Z',
        updated_at: '2026-11-01T12:00:00.000000Z',
      },
    });
    await expect(result).resolves.toMatchObject({ id: '3', published: true });
  });

  it('creates and updates a FAQ with bilingual content', async () => {
    const create = firstValueFrom(
      service.create({
        question: { ar: 'س؟', en: 'Q?' },
        answer: { ar: 'ج', en: 'A' },
        categoryId: '4',
        order: 1,
        published: true,
        updatedAt: '2026-01-01',
      }),
    );
    const post = http.expectOne(FAQS);
    expect(post.request.body).toEqual({
      faq_category_id: 4,
      question: { ar: 'س؟', en: 'Q?' },
      answer: { ar: 'ج', en: 'A' },
      is_published: true,
      sort_order: 1,
    });
    post.flush({
      data: {
        id: 20,
        category: { id: 4, name: { ar: 'دعم', en: 'Support' } },
        question: { ar: 'س؟', en: 'Q?' },
        answer: { ar: 'ج', en: 'A' },
        is_published: true,
        sort_order: 1,
        created_at: '2026-11-01T10:00:00.000000Z',
        updated_at: '2026-11-01T10:00:00.000000Z',
      },
    });
    await expect(create).resolves.toMatchObject({
      id: '20',
      categoryId: '4',
      question: { ar: 'س؟', en: 'Q?' },
    });

    const update = firstValueFrom(
      service.update('20', {
        question: { ar: 'س2', en: 'Q2' },
        answer: { ar: 'ج2', en: 'A2' },
        categoryId: '4',
        order: 2,
        published: false,
        updatedAt: '2026-01-01',
      }),
    );
    const put = http.expectOne(`${FAQS}/20`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.is_published).toBe(false);
    put.flush({
      data: {
        id: 20,
        category: { id: 4, name: { ar: 'دعم', en: 'Support' } },
        question: { ar: 'س2', en: 'Q2' },
        answer: { ar: 'ج2', en: 'A2' },
        is_published: false,
        sort_order: 2,
        created_at: '2026-11-01T10:00:00.000000Z',
        updated_at: '2026-11-01T12:00:00.000000Z',
      },
    });
    await expect(update).resolves.toMatchObject({ published: false, order: 2 });
  });

  it('publishes a FAQ via PATCH …/publish', async () => {
    const result = firstValueFrom(service.setPublished('20', false));
    const request = http.expectOne(`${FAQS}/20/publish`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ is_published: false });
    request.flush({
      data: {
        id: 20,
        category: { id: 4, name: { ar: 'دعم', en: 'Support' } },
        question: { ar: 'س', en: 'Q' },
        answer: { ar: 'ج', en: 'A' },
        is_published: false,
        sort_order: 1,
        created_at: '2026-11-01T10:00:00.000000Z',
        updated_at: '2026-11-01T12:00:00.000000Z',
      },
    });
    await expect(result).resolves.toMatchObject({ id: '20', published: false });
  });

  it('deletes categories and FAQs with 204 responses', async () => {
    const removeCategory = firstValueFrom(service.removeCategory('3'));
    http.expectOne(`${CATEGORIES}/3`).flush('', { status: 204, statusText: 'No Content' });
    await expect(removeCategory).resolves.toBeUndefined();

    const removeFaq = firstValueFrom(service.remove('20'));
    http.expectOne(`${FAQS}/20`).flush('', { status: 204, statusText: 'No Content' });
    await expect(removeFaq).resolves.toBeUndefined();
  });

  it('propagates list and mutation failures', async () => {
    const list = firstValueFrom(service.listCategories());
    http.expectOne(CATEGORIES).flush({ message: 'fail' }, { status: 500, statusText: 'Error' });
    await expect(list).rejects.toBeTruthy();

    const publish = firstValueFrom(service.setPublished('1', true));
    http
      .expectOne(`${FAQS}/1/publish`)
      .flush({ message: 'fail' }, { status: 422, statusText: 'Unprocessable Entity' });
    await expect(publish).rejects.toBeTruthy();
  });
});
