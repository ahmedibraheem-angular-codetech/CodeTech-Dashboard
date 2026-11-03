import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api';
import { environment } from '../../../../environments/environment';
import { InquiriesService } from './inquiries.service';
import { ProjectRequestsService } from './project-requests.service';

describe('ProjectRequestsService', () => {
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
      api: TestBed.inject(ProjectRequestsService),
      inquiries: TestBed.inject(InquiriesService),
      http: TestBed.inject(HttpTestingController),
    };
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('uses /admin/project-requests and never /admin/inquiries', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(api.list());

    const req = http.expectOne(
      (r) => r.url === `${base}/admin/project-requests` && r.params.get('page') === '1',
    );
    expect(req.request.url).not.toContain('/admin/inquiries');
    req.flush({
      data: [
        {
          id: 57,
          reference: 'REQ-00057',
          type: 'project_request',
          status: 'in_progress',
          name: 'سارة',
          organization: 'مؤسسة',
          phone: '+966',
          email: null,
          service: { id: 2, name: 'تصميم UI/UX' },
          message: 'نص',
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
        path: `${base}/admin/project-requests`,
        per_page: 100,
        to: 1,
        total: 1,
      },
    });

    const rows = await pending;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe('progress');
    expect(rows[0]?.product).toBe('تصميم UI/UX');
    expect(rows[0]?.reference).toBe('REQ-00057');
    http.expectNone(`${base}/admin/inquiries`);
  });

  it('keeps inquiries on their own base path when both services load', async () => {
    const { api, inquiries, http } = setup();
    const projectPending = firstValueFrom(api.stats());
    const inquiryPending = firstValueFrom(inquiries.stats());

    http.expectOne(`${base}/admin/project-requests/stats`).flush({
      data: {
        total: { value: 4, previous: 3, change_pct: 33 },
        new: { value: 1, previous: 1, change_pct: 0 },
        in_progress: { value: 2, previous: 1, change_pct: 100 },
        closed: { value: 1, previous: 1, change_pct: 0 },
      },
    });
    http.expectOne(`${base}/admin/inquiries/stats`).flush({
      data: {
        total: { value: 10, previous: 8, change_pct: 25 },
        new: { value: 2, previous: 1, change_pct: 100 },
        in_progress: { value: 3, previous: 3, change_pct: 0 },
        closed: { value: 5, previous: 4, change_pct: 25 },
      },
    });

    expect((await projectPending).progress.value).toBe(2);
    expect((await inquiryPending).progress.value).toBe(3);
  });

  it('loads detail notes and replies then returns null on 404', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(api.get('16'));
    http.expectOne(`${base}/admin/project-requests/16`).flush({
      data: detailFixture(),
    });
    const item = await pending;
    expect(item?.reference).toBe('REQ-00057');
    expect(item?.product).toBe('تصميم UI/UX');

    const missing = firstValueFrom(api.get('999'));
    http.expectOne(`${base}/admin/project-requests/999`).flush(
      { message: 'Not found' },
      { status: 404, statusText: 'Not Found' },
    );
    expect(await missing).toBeNull();
  });

  it('posts notes and replies then reloads detail; closes via status body', async () => {
    const { api, http } = setup();

    const notePending = firstValueFrom(api.addNote('16', 'ملاحظة'));
    const noteReq = http.expectOne(`${base}/admin/project-requests/16/notes`);
    expect(noteReq.request.method).toBe('POST');
    expect(noteReq.request.body).toEqual({ body: 'ملاحظة' });
    noteReq.flush({
      data: {
        id: 1,
        body: 'ملاحظة',
        author: { id: 1, name: 'Admin' },
        created_at: '2026-10-29T09:00:00.000000Z',
      },
    });
    http.expectOne(`${base}/admin/project-requests/16`).flush({
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
    const replyReq = http.expectOne(`${base}/admin/project-requests/16/replies`);
    expect(replyReq.request.body).toEqual({ body: 'رد' });
    replyReq.flush({
      data: {
        id: 2,
        body: 'رد',
        emailed_at: null,
        author: { id: 1, name: 'Admin' },
        created_at: '2026-10-29T10:00:00.000000Z',
      },
    });
    http.expectOne(`${base}/admin/project-requests/16`).flush({
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
    const closeReq = http.expectOne(`${base}/admin/project-requests/16/status`);
    expect(closeReq.request.method).toBe('PATCH');
    expect(closeReq.request.body).toEqual({ status: 'closed', note: 'تم' });
    closeReq.flush({ data: detailFixture({ status: 'closed' }) });
    expect((await closePending).status).toBe('closed');
  });

  it('deletes a project request and exports csv from its own path', async () => {
    const { api, http } = setup();
    const removePending = firstValueFrom(api.remove('16'));
    const deleteReq = http.expectOne(`${base}/admin/project-requests/16`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush('', { status: 204, statusText: 'No Content' });
    await removePending;

    const exportPending = firstValueFrom(api.exportCsv());
    http.expectOne(`${base}/admin/project-requests/export`).flush(new Blob(['id\n']));
    const blob = await exportPending;
    expect(blob.size).toBeGreaterThan(0);
    http.expectNone((r) => r.url.includes('/admin/inquiries'));
  });

  it('surfaces API errors from list', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(api.list()).then(
      () => 'ok',
      () => 'error',
    );
    http
      .expectOne((req) => req.url === `${base}/admin/project-requests`)
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
    id: 57,
    reference: 'REQ-00057',
    type: 'project_request' as const,
    status: 'new' as const,
    name: 'سارة',
    organization: 'مؤسسة',
    phone: '+966',
    email: null,
    service: { id: 2, name: 'تصميم UI/UX' },
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
