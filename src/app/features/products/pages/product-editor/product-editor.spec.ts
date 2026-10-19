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

    expect(root.querySelector('p-stepper.wizard')).not.toBeNull();
    expect(root.querySelector('.section-tabs')).toBeNull();
    expect(root.textContent).toContain('التالي');

    root.querySelector<HTMLButtonElement>('.editor-nav--next')?.click();
    fixture.detectChanges();

    const marks = [...root.querySelectorAll<HTMLButtonElement>('.wizard__step')];
    expect(marks[0]?.classList.contains('is-done')).toBe(true);
    expect(marks[0]?.querySelector('.pi-check')).not.toBeNull();
    expect(marks[1]?.classList.contains('is-done')).toBe(false);

    marks[0]?.click();
    fixture.detectChanges();
    expect(marks[0]?.classList.contains('is-done')).toBe(false);
    expect(marks[0]?.querySelector('.pi-check')).toBeNull();
  });

  it('switches form copy with the Arabic and English locale tab', async () => {
    const fixture = await render('create');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.textContent).toContain('عنوان المنتج');
    expect(root.textContent).toContain('مميزات المنتج');

    const english = [...root.querySelectorAll<HTMLButtonElement>('.locale-switch__option')].find(
      (button) => button.textContent?.includes('English'),
    );
    english?.click();
    fixture.detectChanges();

    expect(root.textContent).toContain('Product title');
    expect(root.textContent).toContain('Product features');
    expect(root.textContent).toContain('Add a feature');
  });

  it('uses tabs on the edit flow and keeps the product name', async () => {
    const fixture = await render('edit', 'info-system');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('.section-tabs[role="tablist"]')).not.toBeNull();
    expect(root.querySelector('p-stepper')).toBeNull();
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
