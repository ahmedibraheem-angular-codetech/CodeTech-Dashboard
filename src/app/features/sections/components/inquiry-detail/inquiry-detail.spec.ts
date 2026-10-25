import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { InquiryDetailPage } from './inquiry-detail';

type InquiryHarness = InquiryDetailPage & {
  openComposer(kind: 'note' | 'reply'): void;
  saveComposer(): void;
  closeRequest(): void;
  remove(): Promise<void>;
};

describe('InquiryDetailPage', () => {
  afterEach(() => vi.restoreAllMocks());

  async function render(id: string) {
    TestBed.configureTestingModule({
      imports: [InquiryDetailPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    const fixture = TestBed.createComponent(InquiryDetailPage);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function page(fixture: Awaited<ReturnType<typeof render>>): InquiryHarness {
    return fixture.componentInstance as InquiryHarness;
  }

  it('renders the seeded inquiry and the send-reply action', async () => {
    const fixture = await render('REQ-00000');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.textContent).toContain('REQ-00000');
    expect(root.textContent).toContain('محمد عبدالمجيد حسن');
    expect(root.textContent).toContain('إرسال رد');
    expect(root.textContent).toContain('إضافة ملحوظة');
    expect(root.querySelector('.inquiry-card--note')).toBeNull();
    expect(root.querySelectorAll('.inquiry-step__check')).toHaveLength(1);
    expect(root.querySelectorAll('.inquiry-step__dot')).toHaveLength(1);
  });

  it('shows the note and reply cards on a follow-up inquiry', async () => {
    const fixture = await render('REQ-00001');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('.inquiry-card--note')).not.toBeNull();
    expect(root.querySelector('.inquiry-card--reply')).not.toBeNull();
    expect(root.textContent).toContain('إغلاق الطلب');
    expect(root.textContent).toContain('زياد محمد عبدالسميع');
    expect(root.querySelectorAll('.inquiry-step__check')).toHaveLength(3);
    expect(root.querySelectorAll('.inquiry-step__dot')).toHaveLength(1);
  });

  it('opens and cancels the note composer', async () => {
    const fixture = await render('REQ-00000');
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

  it('opens and cancels the reply composer', async () => {
    const fixture = await render('REQ-00000');
    const component = page(fixture);

    component.openComposer('reply');
    fixture.detectChanges();
    expect(component.composer()).toBe('reply');

    component.composer.set(null);
    fixture.detectChanges();
    expect(component.composer()).toBeNull();
  });

  it('rejects an empty draft and keeps the composer open', async () => {
    const fixture = await render('REQ-00000');
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

  it('saves a note and shows the note card', async () => {
    const fixture = await render('REQ-00000');
    const component = page(fixture);
    const root: HTMLElement = fixture.nativeElement;

    component.openComposer('note');
    component.draft.setValue('ملحوظة اختبارية من المواصفات');
    component.saveComposer();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.composer()).toBeNull();
    expect(component.item()!.notes.length).toBeGreaterThan(0);
    expect(component.item()!.notes.at(-1)?.body).toContain('ملحوظة اختبارية');
    expect(root.querySelector('.inquiry-card--note')).not.toBeNull();
    expect(root.textContent).toContain('ملحوظة اختبارية من المواصفات');
  });

  it('saves a reply and updates status to progress', async () => {
    const fixture = await render('REQ-00000');
    const component = page(fixture);
    const root: HTMLElement = fixture.nativeElement;

    expect(component.item()!.reply).toBeNull();
    component.openComposer('reply');
    component.draft.setValue('رد اختباري من المواصفات');
    component.saveComposer();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.composer()).toBeNull();
    expect(component.item()!.reply?.body).toContain('رد اختباري');
    expect(component.item()!.status).toBe('progress');
    expect(root.querySelector('.inquiry-card--reply')).not.toBeNull();
    expect(root.textContent).toContain('رد اختباري من المواصفات');
  });

  it('closes the request without confirmation', async () => {
    const fixture = await render('REQ-00001');
    const component = page(fixture);

    expect(component.item()!.status).toBe('progress');
    component.closeRequest();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.item()!.status).toBe('closed');
  });

  it('deletes the inquiry after confirmation and navigates to the list', async () => {
    const fixture = await render('REQ-00000');
    const component = page(fixture);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(ConfirmDialog.prototype, 'ask').mockResolvedValue(true);

    await component.remove();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/contact/inquiries']);
  });

  it('does not delete when confirmation is cancelled', async () => {
    const fixture = await render('REQ-00000');
    const component = page(fixture);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(ConfirmDialog.prototype, 'ask').mockResolvedValue(false);

    await component.remove();
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
    expect(component.item()?.id).toBe('REQ-00000');
  });
});
