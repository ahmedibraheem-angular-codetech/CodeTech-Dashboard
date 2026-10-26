import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { SectionPage } from './section';

function route(titleKey: string): ActivatedRoute {
  return {
    data: of({ titleKey }),
    snapshot: { data: { titleKey } },
  } as unknown as ActivatedRoute;
}

describe('SectionPage', () => {
  beforeEach(() => {
    // PrimeNG TabList uses ResizeObserver; jsdom does not provide it.
    globalThis.ResizeObserver ??= class {
      observe(): void {
        /* no-op */
      }
      unobserve(): void {
        /* no-op */
      }
      disconnect(): void {
        /* no-op */
      }
    };
  });

  async function render(titleKey: string) {
    TestBed.configureTestingModule({
      imports: [SectionPage],
      providers: [
        MessageService,
        { provide: API_LATENCY_MS, useValue: 0 },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: route(titleKey) },
      ],
    });
    const fixture = TestBed.createComponent(SectionPage);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders the About page on the about route', async () => {
    const fixture = await render('nav.about');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('app-about-page')).not.toBeNull();
    expect(root.textContent).toContain('إدارة صفحة عن كود التقنية');
  });

  it('renders the inquiries board on the inquiries route', async () => {
    const fixture = await render('nav.inquiries');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('app-inquiries-board')).not.toBeNull();
    expect(root.querySelector('app-about-page')).toBeNull();
    expect(root.querySelector('h1')?.textContent).toContain('الاستفسارات');
  });

  it('renders the same requests board on start projects, with that page title', async () => {
    const fixture = await render('nav.startProjects');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('app-inquiries-board')).not.toBeNull();
    expect(root.querySelector('h1')?.textContent).toContain('بدء المشاريع');
    expect(root.textContent).toContain('إدارة الاستفسارات المستقبلة');
  });

  it('renders the reviews board on the reviews route', async () => {
    const fixture = await render('nav.reviews');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('app-reviews-board')).not.toBeNull();
    expect(root.querySelector('h1')?.textContent).toContain('آراء العملاء والتقييمات');
  });

  it('renders the FAQ board on the faq route', async () => {
    const fixture = await render('nav.faq');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('app-faq-board')).not.toBeNull();
    expect(root.querySelector('h1')?.textContent).toContain('الأسئلة الشائعة');
  });

  it('renders the legal board on the terms route', async () => {
    const fixture = await render('nav.terms');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('app-legal-document-board')).not.toBeNull();
    expect(root.querySelector('h1')?.textContent).toContain('الشروط والأحكام');
  });

  it('renders the legal board on the privacy route', async () => {
    const fixture = await render('nav.privacy');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('app-legal-document-board')).not.toBeNull();
    expect(root.querySelector('h1')?.textContent).toContain('سياسة الخصوصية');
  });

  it('keeps every other section route as a placeholder', async () => {
    const fixture = await render('nav.productsItem');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('app-about-page')).toBeNull();
    expect(root.querySelector('app-faq-board')).toBeNull();
    expect(root.querySelector('app-legal-document-board')).toBeNull();
    expect(root.querySelector('app-state-view')).not.toBeNull();
  });
});
