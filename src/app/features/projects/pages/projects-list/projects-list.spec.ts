import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { LanguageService } from '../../../../core/services/language.service';
import { ProjectsPage } from './projects-list';

describe('ProjectsPage', () => {
  async function render() {
    TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    localStorage.setItem('codetech.language', 'ar');
    const fixture = TestBed.createComponent(ProjectsPage);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders the project catalog with distinct tiles', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('إدارة المشاريع');
    expect(root.textContent).toContain('وصلني');
    expect(root.querySelectorAll('.project-tile')).toHaveLength(6);
    expect(root.querySelector('a[href="/projects/new"]')).not.toBeNull();
  });

  it('shows empty state when the catalog is hidden', async () => {
    const fixture = await render();
    const api = fixture.componentInstance.api;
    api.toggleCatalog();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('لا توجد مشاريع بعد');
    expect(fixture.nativeElement.querySelectorAll('.project-tile')).toHaveLength(0);
  });

  it('cancels delete when the confirm dialog is declined', async () => {
    const fixture = await render();
    const confirm = fixture.componentRef.instance['confirm'];
    vi.spyOn(confirm(), 'ask').mockResolvedValue(false);
    await fixture.componentInstance['remove'](fixture.componentInstance.items()[0]!);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.project-tile')).toHaveLength(6);
  });

  it('switches tile copy with the UI language', async () => {
    const fixture = await render();
    const lang = TestBed.inject(LanguageService);
    lang.set('en');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Waslny');
    expect(fixture.nativeElement.textContent).toContain('Manage projects');
    expect(fixture.nativeElement.textContent).toContain('Showing');
    lang.set('ar');
  });
});
