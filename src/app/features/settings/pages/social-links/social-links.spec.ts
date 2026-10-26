import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { SocialLinksPage } from './social-links';

describe('SocialLinksPage', () => {
  async function render() {
    TestBed.configureTestingModule({
      imports: [SocialLinksPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }],
    });
    const fixture = TestBed.createComponent(SocialLinksPage);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders site details, location and social channel cards', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('h1')?.textContent).toContain('روابط التواصل الاجتماعي');
    expect(root.textContent).toContain('تفاصيل الموقع');
    expect(root.textContent).toContain('الموقع');
    expect(root.querySelectorAll('app-social-link-card').length).toBeGreaterThanOrEqual(6);
    expect(root.textContent).toContain('LinkedIn');
    expect(root.textContent).toContain('واتساب');
  });

  it('opens the edit-channel modal from a social card action', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    // Seed already uses every platform, so Add is a no-op; Edit always opens.
    const edit = [...root.querySelectorAll('button')].find((btn) =>
      (btn.textContent ?? '').includes('تعديل'),
    );
    expect(edit).toBeTruthy();
    edit?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // PrimeNG dialog content is portaled to document.body.
    const overlay = document.body.textContent ?? '';
    expect(overlay).toContain('المنصة');
    expect(overlay).toContain('حالة النشر');
  });
});


