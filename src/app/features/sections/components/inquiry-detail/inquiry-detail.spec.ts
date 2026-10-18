import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { InquiryDetailPage } from './inquiry-detail';

describe('InquiryDetailPage', () => {
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
});
