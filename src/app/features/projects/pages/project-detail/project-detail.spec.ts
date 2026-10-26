import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { ProjectDetailPage } from './project-detail';

describe('ProjectDetailPage', () => {
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

  afterEach(() => vi.unstubAllGlobals());

  async function render(id: string) {
    TestBed.configureTestingModule({
      imports: [ProjectDetailPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    localStorage.setItem('codetech.language', 'ar');
    const fixture = TestBed.createComponent(ProjectDetailPage);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders project data and edit navigation', async () => {
    const fixture = await render('wasly');
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('وصلني');
    expect(root.querySelector('a[href="/projects/wasly/edit"]')).not.toBeNull();
    expect(root.textContent).toContain('بيانات المشروع');
  });

  it('renders identity button title, body, and non-empty images', async () => {
    const fixture = await render('wasly');
    const root: HTMLElement = fixture.nativeElement;
    const identityTab = [...root.querySelectorAll('button, a, [role="tab"]')].find((item) =>
      item.textContent?.includes('الهوية الرقمية'),
    );
    expect(identityTab).toBeTruthy();
    (identityTab as HTMLElement).click();
    fixture.detectChanges();

    expect(root.textContent).toContain('الهوية البصرية');
    expect(root.textContent).toContain('ألوان وصور تعكس شخصية العلامة للمشروع.');
    const images = root.querySelectorAll('.project-detail__identity img');
    expect(images.length).toBe(4);
    expect([...images].every((image) => (image as HTMLImageElement).src.length > 0)).toBe(true);
  });

  it('shows an empty state for a missing project id', async () => {
    const fixture = await render('missing-project');
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('لم يتم العثور على هذا المشروع');
  });
});
