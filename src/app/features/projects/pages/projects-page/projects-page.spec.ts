import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { API_LATENCY_MS } from '../../../../core/config/latency';
import { LanguageService } from '../../../../core/services/language.service';
import { ProjectsPageManage } from './projects-page';

const PROJECT_GRANTS = [
  'projects.view',
  'projects.create',
  'projects.update',
  'projects.delete',
] as const;

describe('ProjectsPageManage', () => {

  const dialogRoot = (): HTMLElement => document.body;

  afterEach(() => {
    document.querySelectorAll('.p-dialog-mask, .p-dialog').forEach((node) => node.remove());
  });

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
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...PROJECT_GRANTS],
      }),
    );
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

    expect(dialogRoot().textContent).toContain('تعديل أرقام كود التقنية');
    expect(dialogRoot().querySelectorAll('.projects-numbers-editor__card')).toHaveLength(4);
    expect(dialogRoot().textContent).toContain('نقطة 1');
    expect(dialogRoot().textContent).toContain('الجواب');
  });

  it('switches editor field values when the content locale changes', async () => {
    const { fixture, root } = await render();
    (root.querySelector('.projects-numbers__edit') as HTMLButtonElement).click();
    fixture.detectChanges();
    await settle(fixture);

    const firstLabel = () =>
      dialogRoot().querySelector('.projects-numbers-editor__card input') as HTMLInputElement | null;
    expect(firstLabel()?.value).toBe('رضا العملاء');

    const english = dialogRoot().querySelector(
      '.locale-switch__option[aria-pressed="false"]',
    ) as HTMLButtonElement | null;
    expect(english?.textContent).toContain('English');
    english?.click();
    fixture.detectChanges();
    await settle(fixture);

    expect(firstLabel()?.value).toBe('Customer satisfaction');
    expect(dialogRoot().textContent).toContain('Point 1');
    expect(dialogRoot().textContent).toContain('Answer');
  });
});
