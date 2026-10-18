import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { ProductEditor } from './product-editor';

describe('ProductEditor', () => {
  async function render(mode: 'create' | 'edit', id = '') {
    TestBed.configureTestingModule({
      imports: [ProductEditor],
      providers: [
        MessageService,
        { provide: API_LATENCY_MS, useValue: 0 },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { data: of({ mode }), snapshot: { data: { mode } } },
        },
      ],
    });
    const fixture = TestBed.createComponent(ProductEditor);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('keeps a stepper on the create flow', async () => {
    const fixture = await render('create');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('.wizard')).not.toBeNull();
    expect(root.querySelector('[role="tablist"]')).toBeNull();
    expect(root.textContent).toContain('التالي');
  });

  it('uses tabs on the edit flow and keeps the product name', async () => {
    const fixture = await render('edit', 'info-system');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('[role="tablist"]')).not.toBeNull();
    expect(root.querySelector('.wizard')).toBeNull();
    expect(root.querySelector<HTMLInputElement>('input:not([type="file"])')?.value).toBe(
      'نظام إدارة خدمات تقنية المعلومات',
    );

    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    tabs[2]?.click();
    fixture.detectChanges();
    expect(root.textContent).toContain('ما يقدمه المنتج');
    tabs[0]?.click();
    fixture.detectChanges();
    const name = root.querySelector<HTMLInputElement>('input:not([type="file"])');
    expect(name?.value).toBe('نظام إدارة خدمات تقنية المعلومات');
  });
});
