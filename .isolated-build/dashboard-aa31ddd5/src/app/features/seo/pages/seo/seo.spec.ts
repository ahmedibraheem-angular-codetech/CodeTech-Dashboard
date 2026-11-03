import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { environment } from '../../../../../environments/environment';
import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { apiUrl } from '../../../../core/config/api';
import { SeoPage } from './seo';

const SEO = apiUrl(environment.apiUrl, 'admin/seo');
const SEO_GRANTS = ['seo.view', 'seo.create', 'seo.update', 'seo.delete'] as const;

describe('SeoPage', () => {
  // jsdom has no ResizeObserver, which PrimeNG's scrollable tab list uses.
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function render() {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [SeoPage],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...SEO_GRANTS],
      }),
    );
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(SeoPage);
    fixture.detectChanges();
    http.expectOne(SEO).flush({
      data: [
        {
          page: 'global',
          meta_title: { ar: 'إعدادات SEO', en: 'SEO' },
          slug: 'site',
          meta_keywords: { ar: [], en: [] },
          meta_description: { ar: '', en: '' },
          thumbnail: null,
          thumbnail_title: { ar: '', en: '' },
          thumbnail_alt: { ar: '', en: '' },
          updated_by: null,
          updated_at: null,
        },
      ],
    });
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement, http };
  }

  it('renders the seven page tabs on one shared layout after overview load', () => {
    const { root, http } = render();
    const tabs = root.querySelectorAll('app-page-tabs [role="tab"]');

    expect(tabs).toHaveLength(7);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(root.querySelectorAll('.seo-panel')).toHaveLength(2);
    expect(root.querySelector('.seo-drop')).not.toBeNull();
    expect(root.querySelector('#seo-description')).not.toBeNull();
    http.verify();
  });

  it('keeps the same cards when another page tab is selected', () => {
    const { fixture, root, http } = render();
    const tabs = root.querySelectorAll<HTMLButtonElement>('app-page-tabs [role="tab"]');

    tabs[3].click();
    fixture.detectChanges();

    expect(tabs[3].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(root.querySelectorAll('.seo-panel')).toHaveLength(2);
    http.verify();
  });

  it('follows the card language for the field copy and form direction', () => {
    const { fixture, root, http } = render();
    const meta = root.querySelectorAll('.seo-panel')[0];
    const body = () => meta.querySelector('.seo-panel__body');

    expect(meta.textContent).toContain('عنوان SEO لصفحة إعدادات SEO');
    expect(body()?.getAttribute('dir')).toBe('rtl');

    meta.querySelectorAll<HTMLButtonElement>('.locale-switch__option')[0].click();
    fixture.detectChanges();

    expect(meta.textContent).toContain('Meta Title');
    expect(body()?.getAttribute('dir')).toBe('ltr');
    expect(root.querySelectorAll('.seo-panel')[1].textContent).toContain('رفع الصورة');
    http.verify();
  });

  it('counts the description and restores it on undo', () => {
    const { fixture, root, http } = render();
    const description = root.querySelector<HTMLTextAreaElement>('#seo-description');
    expect(description).not.toBeNull();

    description!.value = 'Hello';
    description!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(root.querySelector('.seo-count span')?.textContent).toBe('5/160');

    const revert = root.querySelectorAll('p-button')[1].querySelector('button');
    expect(revert?.disabled).toBe(false);
    revert?.click();
    fixture.detectChanges();

    expect(root.querySelector<HTMLTextAreaElement>('#seo-description')?.value).toBe('');
    expect(root.querySelector('.seo-count span')?.textContent).toBe('0/160');
    http.verify();
  });

  it('rejects a thumbnail that is not a PNG or JPG', () => {
    const { fixture, root, http } = render();
    const input = root.querySelector<HTMLInputElement>('input[type="file"]');
    const file = new File(['gif'], 'anim.gif', { type: 'image/gif' });
    Object.defineProperty(input, 'files', { configurable: true, value: { 0: file, length: 1 } });
    input!.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(root.querySelector('.field__error')?.textContent).toContain('PNG');
    http.verify();
  });

  it('shows an error state and reloads the overview on retry', () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [SeoPage],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...SEO_GRANTS],
      }),
    );
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(SeoPage);
    fixture.detectChanges();
    http.expectOne(SEO).flush('nope', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-state-view')).toBeTruthy();
    expect(root.querySelector('app-page-tabs')).toBeNull();

    (fixture.componentInstance as unknown as { reload(): void }).reload();
    fixture.detectChanges();
    http.expectOne(SEO).flush({ data: [] });
    fixture.detectChanges();
    expect(root.querySelector('app-page-tabs')).toBeTruthy();
    http.verify();
  });
});
