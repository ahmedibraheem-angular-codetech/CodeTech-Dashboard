import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { API_BASE_URL } from '../../../../core/config/api';
import { environment } from '../../../../../environments/environment';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { InquiryDetailPage } from './inquiry-detail';

type InquiryHarness = InquiryDetailPage & {
  openComposer(kind: 'note' | 'reply'): void;
  saveComposer(): void;
  closeRequest(): void;
  remove(): Promise<void>;
};

const INQUIRY_GRANTS = [
  'inquiries.view',
  'inquiries.create',
  'inquiries.update',
  'inquiries.delete',
] as const;

const base = environment.apiUrl;

describe('InquiryDetailPage', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.restoreAllMocks();
  });

  async function render(id: string) {
    TestBed.configureTestingModule({
      imports: [InquiryDetailPage],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: base },
        provideRouter([]),
      ],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...INQUIRY_GRANTS],
      }),
    );
    const fixture = TestBed.createComponent(InquiryDetailPage);
    fixture.componentRef.setInput('id', id);
    fixture.componentRef.setInput('permissionModule', 'inquiries');
    fixture.componentRef.setInput('inbox', 'inquiries');
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${base}/admin/inquiries/${id}`).flush({ data: detailDto(id) });
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function page(fixture: Awaited<ReturnType<typeof render>>): InquiryHarness {
    return fixture.componentInstance as InquiryHarness;
  }

  it('renders the inquiry and the send-reply action', async () => {
    const fixture = await render('16');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.textContent).toContain('REQ-00016');
    expect(root.textContent).toContain('محمد عبدالمجيد حسن');
    expect(root.textContent).toContain('إرسال رد');
    expect(root.textContent).toContain('إضافة ملحوظة');
    expect(root.querySelector('.inquiry-card--note')).toBeNull();
  });

  it('shows the note and reply cards on a follow-up inquiry', async () => {
    TestBed.configureTestingModule({
      imports: [InquiryDetailPage],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: base },
        provideRouter([]),
      ],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...INQUIRY_GRANTS],
      }),
    );
    const fixture = TestBed.createComponent(InquiryDetailPage);
    fixture.componentRef.setInput('id', '17');
    fixture.componentRef.setInput('inbox', 'inquiries');
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne(`${base}/admin/inquiries/17`)
      .flush({ data: detailDto('17', { withFollowUp: true }) });
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('.inquiry-card--note')).not.toBeNull();
    expect(root.querySelector('.inquiry-card--reply')).not.toBeNull();
    expect(root.textContent).toContain('إغلاق الطلب');
    expect(root.textContent).toContain('زياد محمد');
  });

  it('opens and cancels the note composer', async () => {
    const fixture = await render('16');
    const component = page(fixture);

    component.openComposer('note');
    fixture.detectChanges();
    expect(component.composer()).toBe('note');
    expect(component.draft.value).toBe('');
    expect(document.body.querySelector('app-inquiry-detail-composer')).not.toBeNull();

    component.composer.set(null);
    fixture.detectChanges();
    expect(component.composer()).toBeNull();
  });

  it('rejects an empty draft and keeps the composer open', async () => {
    const fixture = await render('16');
    const component = page(fixture);

    component.openComposer('note');
    component.draft.setValue('');
    component.saveComposer();
    fixture.detectChanges();

    expect(component.draft.touched).toBe(true);
    expect(component.draft.invalid).toBe(true);
    expect(component.composer()).toBe('note');
    expect(component.item()!.notes).toHaveLength(0);
  });

  it('saves a note after a successful API round-trip', async () => {
    const fixture = await render('16');
    const component = page(fixture);
    const http = TestBed.inject(HttpTestingController);
    const root: HTMLElement = fixture.nativeElement;

    component.openComposer('note');
    component.draft.setValue('ملحوظة اختبارية من المواصفات');
    component.saveComposer();
    fixture.detectChanges();

    http.expectOne(`${base}/admin/inquiries/16/notes`).flush({
      data: {
        id: 9,
        body: 'ملحوظة اختبارية من المواصفات',
        author: { id: 1, name: 'Admin' },
        created_at: '2026-10-29T09:00:00.000000Z',
      },
    });
    http.expectOne(`${base}/admin/inquiries/16`).flush({
      data: detailDto('16', {
        status: 'in_progress',
        notes: [
          {
            id: 9,
            body: 'ملحوظة اختبارية من المواصفات',
            author: { id: 1, name: 'Admin' },
            created_at: '2026-10-29T09:00:00.000000Z',
          },
        ],
      }),
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.composer()).toBeNull();
    expect(component.item()!.notes.at(-1)?.body).toContain('ملحوظة اختبارية');
    expect(root.querySelector('.inquiry-card--note')).not.toBeNull();
  });

  it('saves a reply and updates status to progress', async () => {
    const fixture = await render('16');
    const component = page(fixture);
    const http = TestBed.inject(HttpTestingController);

    component.openComposer('reply');
    component.draft.setValue('رد اختباري من المواصفات');
    component.saveComposer();
    fixture.detectChanges();

    http.expectOne(`${base}/admin/inquiries/16/replies`).flush({
      data: {
        id: 3,
        body: 'رد اختباري من المواصفات',
        emailed_at: null,
        author: { id: 1, name: 'Admin' },
        created_at: '2026-10-29T10:00:00.000000Z',
      },
    });
    http.expectOne(`${base}/admin/inquiries/16`).flush({
      data: detailDto('16', {
        status: 'in_progress',
        replies: [
          {
            id: 3,
            body: 'رد اختباري من المواصفات',
            emailed_at: null,
            author: { id: 1, name: 'Admin' },
            created_at: '2026-10-29T10:00:00.000000Z',
          },
        ],
      }),
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.item()!.reply?.body).toContain('رد اختباري');
    expect(component.item()!.status).toBe('progress');
  });

  it('closes a progress inquiry via status endpoint', async () => {
    TestBed.configureTestingModule({
      imports: [InquiryDetailPage],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: base },
        provideRouter([]),
      ],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...INQUIRY_GRANTS],
      }),
    );
    const fixture = TestBed.createComponent(InquiryDetailPage);
    fixture.componentRef.setInput('id', '17');
    fixture.componentRef.setInput('inbox', 'inquiries');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${base}/admin/inquiries/17`).flush({
      data: detailDto('17', { withFollowUp: true }),
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const component = page(fixture);

    expect(component.item()!.status).toBe('progress');
    component.closeRequest();
    const req = http.expectOne(`${base}/admin/inquiries/17/status`);
    expect(req.request.body).toEqual({ status: 'closed' });
    req.flush({ data: detailDto('17', { withFollowUp: true, status: 'closed' }) });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.item()!.status).toBe('closed');
  });

  it('deletes the inquiry after confirmation and navigates to the list', async () => {
    const fixture = await render('16');
    const component = page(fixture);
    const http = TestBed.inject(HttpTestingController);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(ConfirmDialog.prototype, 'ask').mockResolvedValue(true);

    await component.remove();
    http
      .expectOne(`${base}/admin/inquiries/16`)
      .flush('', { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/contact/inquiries']);
  });

  it('does not delete when confirmation is cancelled', async () => {
    const fixture = await render('16');
    const component = page(fixture);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(ConfirmDialog.prototype, 'ask').mockResolvedValue(false);

    await component.remove();
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
    expect(component.item()?.id).toBe('16');
  });

  it('keeps the editor state when note save fails', async () => {
    const fixture = await render('16');
    const component = page(fixture);
    const http = TestBed.inject(HttpTestingController);

    component.openComposer('note');
    component.draft.setValue('لن تُحفظ');
    component.saveComposer();
    fixture.detectChanges();
    http
      .expectOne(`${base}/admin/inquiries/16/notes`)
      .flush({ message: 'fail' }, { status: 422, statusText: 'Unprocessable Entity' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.saving()).toBe(false);
    expect(component.item()!.notes).toHaveLength(0);
    expect(component.item()!.status).toBe('new');
  });

  it('loads project requests from /admin/project-requests and maps the service label', async () => {
    TestBed.configureTestingModule({
      imports: [InquiryDetailPage],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: base },
        provideRouter([]),
      ],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [
          'project_requests.view',
          'project_requests.create',
          'project_requests.update',
          'project_requests.delete',
        ],
      }),
    );
    const fixture = TestBed.createComponent(InquiryDetailPage);
    fixture.componentRef.setInput('id', '57');
    fixture.componentRef.setInput('permissionModule', 'project_requests');
    fixture.componentRef.setInput('inbox', 'project_requests');
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${base}/admin/project-requests/57`).flush({
      data: {
        id: 57,
        reference: 'REQ-00057',
        type: 'project_request',
        status: 'new',
        name: 'سارة العتيبي',
        organization: 'مؤسسة الريادة',
        phone: '+966 50 412 7788',
        email: 'sara@example.com',
        service: { id: 2, name: 'تصميم UI/UX' },
        message: 'نرغب في إعادة تصميم تطبيق خدمة العملاء لدينا.',
        close_note: null,
        closed_at: null,
        notes: [],
        replies: [],
        timeline: [
          {
            key: 'received',
            state: 'done',
            title: 'تم استلام الطلب',
            description: 'تم الاستقبال',
            at: '2026-10-29T08:00:00.000000Z',
            by: null,
          },
        ],
        created_at: '2026-10-29T08:00:00.000000Z',
        updated_at: '2026-10-29T08:00:00.000000Z',
      },
    });
    http.expectNone((req) => req.url.includes('/admin/inquiries'));
    await fixture.whenStable();
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('REQ-00057');
    expect(root.textContent).toContain('سارة العتيبي');
    expect(root.textContent).toContain('تصميم UI/UX');
    expect(page(fixture).item()?.product).toBe('تصميم UI/UX');
  });
});

function detailDto(
  id: string,
  options: {
    withFollowUp?: boolean;
    status?: 'new' | 'in_progress' | 'closed';
    notes?: unknown[];
    replies?: unknown[];
  } = {},
) {
  const followUp = options.withFollowUp === true;
  return {
    id: Number(id),
    reference: `REQ-${id.padStart(5, '0')}`,
    type: 'inquiry',
    status: options.status ?? (followUp ? 'in_progress' : 'new'),
    name: 'محمد عبدالمجيد حسن',
    organization: 'شركة كود التقنية',
    phone: '+960 0000 000 00',
    email: 'email@gmail.com',
    product: { id: 1, title: 'الما' },
    message: 'مرحبًا',
    close_note: null,
    closed_at: null,
    notes:
      options.notes ??
      (followUp
        ? [
            {
              id: 5,
              body: 'ملاحظة داخلية',
              author: { id: 2, name: 'زياد محمد' },
              created_at: '2026-10-29T09:00:00.000000Z',
            },
          ]
        : []),
    replies:
      options.replies ??
      (followUp
        ? [
            {
              id: 3,
              body: 'رد للعميل',
              emailed_at: null,
              author: { id: 2, name: 'زياد محمد' },
              created_at: '2026-10-29T11:05:00.000000Z',
            },
          ]
        : []),
    timeline: [
      {
        key: 'received',
        state: 'done',
        title: 'تم استلام الطلب',
        description: 'تم الاستقبال',
        at: '2026-10-29T08:00:00.000000Z',
        by: null,
      },
    ],
    created_at: '2026-10-29T08:00:00.000000Z',
    updated_at: '2026-10-29T08:00:00.000000Z',
  };
}
