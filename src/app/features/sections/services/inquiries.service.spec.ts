import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api';
import { environment } from '../../../../environments/environment';
import { InquiriesService } from './inquiries.service';

describe('InquiriesService', () => {
  const base = environment.apiUrl;

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: base },
      ],
    });
    return {
      api: TestBed.inject(InquiriesService),
      http: TestBed.inject(HttpTestingController),
    };
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('lists inquiries across pages and maps status', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(api.list());

    const page1 = http.expectOne(
      (req) => req.url === `${base}/admin/inquiries` && req.params.get('page') === '1',
    );
    page1.flush({
      data: [
        {
          id: 42,
          reference: 'REQ-00042',
          type: 'inquiry',
          status: 'in_progress',
          name: 'محمد',
          organization: 'كود',
          phone: '+966',
          email: 'a@b.c',
          product: { id: 1, title: 'ألما' },
          message: 'مرحبا',
          close_note: null,
          closed_at: null,
          created_at: '2026-10-29T08:00:00.000000Z',
          updated_at: '2026-10-29T08:00:00.000000Z',
        },
      ],
      links: { first: null, last: null, prev: null, next: null },
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        path: `${base}/admin/inquiries`,
        per_page: 100,
        to: 1,
        total: 1,
      },
    });

    const rows = await pending;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe('progress');
    expect(rows[0]?.product).toBe('ألما');
    expect(rows[0]?.reference).toBe('REQ-00042');
  });

  it('loads statistics with in_progress mapped to progress', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(api.stats());
    http.expectOne(`${base}/admin/inquiries/stats`).flush({
      data: {
        total: { value: 10, previous: 8, change_pct: 25 },
        new: { value: 2, previous: 1, change_pct: 100 },
        in_progress: { value: 3, previous: 3, change_pct: 0 },
        closed: { value: 5, previous: 4, change_pct: 25 },
      },
    });
    const stats = await pending;
    expect(stats.progress.value).toBe(3);
  });

  it('loads detail notes and replies then returns null on 404', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(api.get('16'));
    http.expectOne(`${base}/admin/inquiries/16`).flush({
      data: {
        id: 16,
        reference: 'REQ-00016',
        type: 'inquiry',
        status: 'new',
        name: 'عميل',
        organization: 'جهة',
        phone: '+966',
        email: null,
        product: { id: 1, title: 'منتج' },
        message: 'نص',
        close_note: null,
        closed_at: null,
        notes: [],
        replies: [],
        timeline: [],
        created_at: '2026-10-29T08:00:00.000000Z',
        updated_at: '2026-10-29T08:00:00.000000Z',
      },
    });
    const item = await pending;
    expect(item?.reference).toBe('REQ-00016');

    const missing = firstValueFrom(api.get('999'));
    http.expectOne(`${base}/admin/inquiries/999`).flush(
      { message: 'Not found' },
      { status: 404, statusText: 'Not Found' },
    );
    expect(await missing).toBeNull();
  });

  it('posts notes and replies then reloads detail; closes via status body', async () => {
    const { api, http } = setup();

    const notePending = firstValueFrom(api.addNote('16', 'ملاحظة'));
    http.expectOne(`${base}/admin/inquiries/16/notes`).flush({
      data: {
        id: 1,
        body: 'ملاحظة',
        author: { id: 1, name: 'Admin' },
        created_at: '2026-10-29T09:00:00.000000Z',
      },
    });
    http.expectOne(`${base}/admin/inquiries/16`).flush({
      data: detailFixture({
        status: 'in_progress',
        notes: [
          {
            id: 1,
            body: 'ملاحظة',
            author: { id: 1, name: 'Admin' },
            created_at: '2026-10-29T09:00:00.000000Z',
          },
        ],
      }),
    });
    const noted = await notePending;
    expect(noted.status).toBe('progress');
    expect(noted.notes[0]?.body).toBe('ملاحظة');

    const replyPending = firstValueFrom(api.addReply('16', 'رد'));
    http.expectOne(`${base}/admin/inquiries/16/replies`).flush({
      data: {
        id: 2,
        body: 'رد',
        emailed_at: null,
        author: { id: 1, name: 'Admin' },
        created_at: '2026-10-29T10:00:00.000000Z',
      },
    });
    http.expectOne(`${base}/admin/inquiries/16`).flush({
      data: detailFixture({
        status: 'in_progress',
        notes: noted.notes.map((n) => ({
          id: Number(n.id),
          body: n.body,
          author: { id: 1, name: n.author },
          created_at: '2026-10-29T09:00:00.000000Z',
        })),
        replies: [
          {
            id: 2,
            body: 'رد',
            emailed_at: null,
            author: { id: 1, name: 'Admin' },
            created_at: '2026-10-29T10:00:00.000000Z',
          },
        ],
      }),
    });
    const replied = await replyPending;
    expect(replied.reply?.body).toBe('رد');
    expect(replied.replies).toHaveLength(1);

    const closePending = firstValueFrom(api.close('16', 'تم'));
    const closeReq = http.expectOne(`${base}/admin/inquiries/16/status`);
    expect(closeReq.request.method).toBe('PATCH');
    expect(closeReq.request.body).toEqual({ status: 'closed', note: 'تم' });
    closeReq.flush({ data: detailFixture({ status: 'closed' }) });
    expect((await closePending).status).toBe('closed');
  });

  it('deletes an inquiry and exports csv', async () => {
    const { api, http } = setup();
    const removePending = firstValueFrom(api.remove('16'));
    http.expectOne(`${base}/admin/inquiries/16`).flush('', { status: 204, statusText: 'No Content' });
    await removePending;

    const exportPending = firstValueFrom(api.exportCsv());
    http.expectOne(`${base}/admin/inquiries/export`).flush(new Blob(['id\n']));
    const blob = await exportPending;
    expect(blob.size).toBeGreaterThan(0);
  });

  it('surfaces API errors from list', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(api.list()).then(
      () => 'ok',
      () => 'error',
    );
    http
      .expectOne((req) => req.url === `${base}/admin/inquiries`)
      .flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });
    expect(await pending).toBe('error');
  });
});

function detailFixture(
  extra: Partial<{
    status: 'new' | 'in_progress' | 'closed';
    notes: unknown[];
    replies: unknown[];
  }> = {},
) {
  return {
    id: 16,
    reference: 'REQ-00016',
    type: 'inquiry',
    status: 'new',
    name: 'عميل',
    organization: 'جهة',
    phone: '+966',
    email: null,
    product: { id: 1, title: 'منتج' },
    message: 'نص',
    close_note: null,
    closed_at: null,
    notes: [],
    replies: [],
    timeline: [],
    created_at: '2026-10-29T08:00:00.000000Z',
    updated_at: '2026-10-29T08:00:00.000000Z',
    ...extra,
  };
}
