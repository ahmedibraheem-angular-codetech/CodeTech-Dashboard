import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { LanguageService } from '../../../../core/services/language.service';
import { ProjectsPageManage } from './projects-page';

describe('ProjectsPageManage', () => {
  async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function render() {
    TestBed.configureTestingModule({
      imports: [ProjectsPageManage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const fixture = TestBed.createComponent(ProjectsPageManage);
    fixture.detectChanges();
    await settle(fixture);
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('renders the numbers panel with seeded stats', async () => {
    const { root } = await render();
    expect(root.textContent).toContain('إدارة صفحة المشاريع');
    expect(root.textContent).toContain('أرقام كود التقنية');
    expect(root.textContent).toContain('رضا العملاء');
    expect(root.textContent).toContain('4.8');
    expect(root.querySelectorAll('.projects-numbers__card')).toHaveLength(4);
  });

  it('applies the outer container and card class hooks from the design', async () => {
    const { root } = await render();
    const panel = root.querySelector('.projects-numbers-panel');
    const tray = root.querySelector('.projects-numbers-panel .projects-numbers');
    expect(panel).not.toBeNull();
    expect(tray).not.toBeNull();
    expect(tray?.classList.contains('is-off')).toBe(true);
    expect(root.querySelector('.projects-numbers__grid')).not.toBeNull();
    expect(root.querySelector('.projects-numbers__card')).not.toBeNull();
  });

  it('opens the bulk numbers editor with a card per seeded stat', async () => {
    const { fixture, root } = await render();
    const edit = root.querySelector('.projects-numbers__edit') as HTMLButtonElement | null;
    expect(edit).not.toBeNull();
    edit?.click();
    fixture.detectChanges();
    await settle(fixture);

    expect(root.textContent).toContain('تعديل أرقام كود التقنية');
    expect(root.querySelectorAll('.projects-numbers-editor__card')).toHaveLength(4);
    expect(root.textContent).toContain('نقطة 1');
    expect(root.textContent).toContain('الجواب');
  });

  it('switches editor field values when the content locale changes', async () => {
    const { fixture, root } = await render();
    (root.querySelector('.projects-numbers__edit') as HTMLButtonElement).click();
    fixture.detectChanges();
    await settle(fixture);

    const firstLabel = () =>
      root.querySelector(
        '.projects-numbers-editor__card input',
      ) as HTMLInputElement | null;
    expect(firstLabel()?.value).toBe('رضا العملاء');

    const english = root.querySelector(
      '.locale-switch__option[aria-pressed="false"]',
    ) as HTMLButtonElement | null;
    expect(english?.textContent).toContain('English');
    english?.click();
    fixture.detectChanges();
    await settle(fixture);

    expect(firstLabel()?.value).toBe('Customer satisfaction');
    expect(root.textContent).toContain('Point 1');
    expect(root.textContent).toContain('Answer');
  });
});
