import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, firstValueFrom, throwError } from 'rxjs';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { LanguageService } from '../../../../core/services/language.service';
import { blankProject, localeText, type Project } from '../../models/project.model';
import { PROJECTS_SEED } from '../../services/projects.mock';
import { ProjectsService } from '../../services/projects.service';
import { ProjectsPage } from './projects-list';

describe('ProjectsPage', () => {
  async function settle<T>(fixture: { detectChanges(): void; whenStable(): Promise<void> } & T) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function render(prepare?: (api: ProjectsService) => Promise<void>) {
    TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const api = TestBed.inject(ProjectsService);
    await prepare?.(api);
    const fixture = TestBed.createComponent(ProjectsPage);
    fixture.detectChanges();
    return { fixture, api, root: fixture.nativeElement as HTMLElement };
  }

  const tiles = (root: HTMLElement) => root.querySelectorAll('.project-tile');
  const confirmOf = (fixture: { componentRef: { instance: ProjectsPage } }) =>
    fixture.componentRef.instance['confirm']();

  afterEach(() => {
    TestBed.inject(LanguageService).set('ar');
  });

  it('shows the loading state until the projects arrive', async () => {
    const { fixture, root } = await render();
    expect(root.querySelector('app-state-view .pi-inbox')).toBeNull();
    expect(root.querySelector('app-state-view p-progress-spinner')).not.toBeNull();
    expect(tiles(root)).toHaveLength(0);
    await settle(fixture);
    expect(root.querySelector('app-state-view')).toBeNull();
    expect(tiles(root)).toHaveLength(6);
  });

  it('renders the project catalog with distinct tiles', async () => {
    const { fixture, root } = await render();
    await settle(fixture);
    expect(root.textContent).toContain('إدارة المشاريع');
    expect(root.textContent).toContain('وصلني');
    expect(tiles(root)).toHaveLength(6);
    expect(root.querySelector('a[href="/projects/new"]')).not.toBeNull();
    expect(fixture.componentInstance.status()).toBe('ready');
  });

  it('renders a usable cover URL as an image src', async () => {
    const { fixture, root } = await render();
    await settle(fixture);
    const seed = PROJECTS_SEED[0]!;
    const cover = root.querySelector(
      `.project-tile a.project-tile__media[href="/projects/${seed.id}"] img`,
    );
    expect(cover?.getAttribute('src')).toBe(seed.coverUrl);
  });

  it('omits cover images for empty, whitespace, and icon cover values', async () => {
    const { fixture, root } = await render(async (api) => {
      for (const project of PROJECTS_SEED) {
        await firstValueFrom(api.remove(project.id));
      }
      const base = structuredClone(PROJECTS_SEED[0]!);
      await firstValueFrom(
        api.save({
          ...base,
          id: 'cover-valid',
          name: localeText('غلاف صالح', 'Valid cover'),
          coverUrl: '/images/project-cover.jpg',
        }),
      );
      await firstValueFrom(
        api.save({
          ...base,
          id: 'cover-empty',
          name: localeText('غلاف فارغ', 'Empty cover'),
          coverUrl: '',
        }),
      );
      await firstValueFrom(
        api.save({
          ...base,
          id: 'cover-space',
          name: localeText('غلاف مسافات', 'Whitespace cover'),
          coverUrl: '   ',
        }),
      );
      await firstValueFrom(
        api.save({
          ...base,
          id: 'cover-icon',
          name: localeText('غلاف أيقونة', 'Icon cover'),
          coverUrl: 'icon:pi-image',
        }),
      );
    });
    await settle(fixture);

    expect(tiles(root)).toHaveLength(4);
    expect(root.textContent).toContain('غلاف صالح');
    expect(root.textContent).toContain('غلاف فارغ');
    expect(root.textContent).toContain('غلاف مسافات');
    expect(root.textContent).toContain('غلاف أيقونة');

    const media = (id: string) =>
      root.querySelector(`.project-tile a.project-tile__media[href="/projects/${id}"]`);
    expect(media('cover-valid')?.querySelector('img')?.getAttribute('src')).toBe(
      '/images/project-cover.jpg',
    );
    expect(media('cover-empty')?.querySelector('img')).toBeNull();
    expect(media('cover-space')?.querySelector('img')).toBeNull();
    expect(media('cover-icon')?.querySelector('img')).toBeNull();
    expect(media('cover-empty')).not.toBeNull();
    expect(media('cover-space')).not.toBeNull();
    expect(media('cover-icon')).not.toBeNull();
    expect(
      [...root.querySelectorAll('.project-tile__media img')].every(
        (image) => (image.getAttribute('src') ?? '').trim().length > 0,
      ),
    ).toBe(true);
  });

  it('shows the empty state after a successful load with no projects', async () => {
    const { fixture, root } = await render(async (api) => {
      for (const project of PROJECTS_SEED) {
        await firstValueFrom(api.remove(project.id));
      }
    });
    await settle(fixture);
    expect(tiles(root)).toHaveLength(0);
    expect(root.querySelector('app-state-view .pi-inbox')).not.toBeNull();
    expect(root.textContent).toContain('لا توجد مشاريع بعد');
    expect(root.querySelector('app-paginator')).toBeNull();
  });

  it('shows an error instead of the empty state when loading fails', async () => {
    TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const api = TestBed.inject(ProjectsService);
    vi.spyOn(api, 'list').mockReturnValue(throwError(() => new Error('offline')));
    const fixture = TestBed.createComponent(ProjectsPage);
    fixture.detectChanges();
    await settle(fixture);
    const root: HTMLElement = fixture.nativeElement;

    expect(fixture.componentInstance.status()).toBe('error');
    expect(root.querySelector('app-state-view .pi-exclamation-circle')).not.toBeNull();
    expect(root.querySelector('app-state-view .pi-inbox')).toBeNull();
    expect(root.textContent).toContain('حدث خطأ');
    expect(tiles(root)).toHaveLength(0);
  });

  it('retries after a load failure and shows the catalog on success', async () => {
    TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const api = TestBed.inject(ProjectsService);
    const list = vi.spyOn(api, 'list').mockReturnValueOnce(throwError(() => new Error('offline')));
    const fixture = TestBed.createComponent(ProjectsPage);
    fixture.detectChanges();
    await settle(fixture);
    expect(fixture.componentInstance.status()).toBe('error');

    const next = new Subject<Project[]>();
    list.mockReturnValueOnce(next.asObservable());
    fixture.componentInstance['retry']();
    expect(fixture.componentInstance.status()).toBe('loading');
    next.next(structuredClone(PROJECTS_SEED));
    next.complete();
    await settle(fixture);

    expect(fixture.componentInstance.status()).toBe('ready');
    expect(tiles(fixture.nativeElement)).toHaveLength(6);
  });

  it('keeps the error state when retry fails again', async () => {
    TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const api = TestBed.inject(ProjectsService);
    vi.spyOn(api, 'list').mockReturnValue(throwError(() => new Error('offline')));
    const fixture = TestBed.createComponent(ProjectsPage);
    fixture.detectChanges();
    await settle(fixture);

    fixture.componentInstance['retry']();
    await settle(fixture);

    expect(fixture.componentInstance.status()).toBe('error');
    expect(
      fixture.nativeElement.querySelector('app-state-view .pi-exclamation-circle'),
    ).not.toBeNull();
  });

  it('ignores a stale list response after a newer load has started', async () => {
    TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const api = TestBed.inject(ProjectsService);
    const first = new Subject<Project[]>();
    const second = new Subject<Project[]>();
    let calls = 0;
    vi.spyOn(api, 'list').mockImplementation(() => {
      calls += 1;
      return calls === 1 ? first.asObservable() : second.asObservable();
    });
    const fixture = TestBed.createComponent(ProjectsPage);
    fixture.detectChanges();

    fixture.componentInstance['retry']();
    const newer = structuredClone(PROJECTS_SEED).slice(0, 2);
    second.next(newer);
    second.complete();
    await settle(fixture);
    expect(fixture.componentInstance.items()).toEqual(newer);

    first.next(structuredClone(PROJECTS_SEED));
    first.complete();
    await settle(fixture);
    expect(fixture.componentInstance.items()).toEqual(newer);
    expect(tiles(fixture.nativeElement)).toHaveLength(2);
  });

  it('shows empty state when the catalog is hidden', async () => {
    const { fixture, root } = await render();
    await settle(fixture);
    const api = fixture.componentInstance.api;
    api.toggleCatalog();
    fixture.detectChanges();
    expect(root.textContent).toContain('لا توجد مشاريع بعد');
    expect(tiles(root)).toHaveLength(0);
  });

  it('cancels delete when the confirm dialog is declined', async () => {
    const { fixture, root } = await render();
    await settle(fixture);
    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(false);
    await fixture.componentInstance['remove'](fixture.componentInstance.items()[0]!);
    fixture.detectChanges();
    expect(tiles(root)).toHaveLength(6);
  });

  it('does not report a successful deletion when the remove request fails', async () => {
    const { fixture, api, root } = await render();
    await settle(fixture);
    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    vi.spyOn(api, 'remove').mockReturnValue(throwError(() => new Error('offline')));
    const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
    const before = tiles(root).length;

    await fixture.componentInstance['remove'](fixture.componentInstance.items()[0]!);
    await settle(fixture);

    expect(tiles(root)).toHaveLength(before);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'حدث خطأ' }),
    );
    expect(toast).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
  });

  async function seedExtraProjects(api: ProjectsService, count: number): Promise<void> {
    const base = PROJECTS_SEED[0]!;
    for (let index = 0; index < count; index += 1) {
      await firstValueFrom(
        api.save({
          ...structuredClone(base),
          id: `extra-${index}`,
          name: localeText(`إضافي ${index}`, `Extra ${index}`),
        }),
      );
    }
  }

  it('paginates long lists and steps back when the last card of a page is removed', async () => {
    const { fixture, root } = await render(async (api) => {
      await seedExtraProjects(api, 5);
    });
    await settle(fixture);
    expect(tiles(root)).toHaveLength(10);
    expect(root.querySelector('app-paginator')).not.toBeNull();

    const page = fixture.componentInstance;
    page['page']({ first: 10, rows: 10 });
    fixture.detectChanges();
    expect(tiles(root)).toHaveLength(1);

    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    await page['remove'](page.visible()[0]!);
    await settle(fixture);

    expect(page.first()).toBe(0);
    expect(tiles(root)).toHaveLength(10);
  });

  it('keeps the current page when other items remain after a deletion', async () => {
    const { fixture, root, api } = await render(async (service) => {
      await seedExtraProjects(service, 5);
    });
    await settle(fixture);

    const page = fixture.componentInstance;
    page['page']({ first: 10, rows: 10 });
    fixture.detectChanges();
    expect(tiles(root)).toHaveLength(1);

    await firstValueFrom(
      api.save({
        ...blankProject(),
        id: 'extra-tail',
        name: localeText('ذيل', 'Tail'),
        published: true,
      }),
    );
    page.items.set(await firstValueFrom(api.list()));
    fixture.detectChanges();
    expect(tiles(root)).toHaveLength(2);

    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    await page['remove'](page.visible()[0]!);
    await settle(fixture);

    expect(page.first()).toBe(10);
    expect(tiles(root)).toHaveLength(1);
  });

  it('stays on a valid page and shows the empty state after deleting the final project', async () => {
    const { fixture, root } = await render(async (api) => {
      for (const project of PROJECTS_SEED.slice(1)) {
        await firstValueFrom(api.remove(project.id));
      }
    });
    await settle(fixture);
    expect(tiles(root)).toHaveLength(1);

    const page = fixture.componentInstance;
    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    await page['remove'](page.items()[0]!);
    await settle(fixture);

    expect(page.first()).toBe(0);
    expect(tiles(root)).toHaveLength(0);
    expect(root.querySelector('app-state-view')?.textContent).toContain('لا توجد مشاريع بعد');
    expect(root.querySelector('app-paginator')).toBeNull();
  });

  it('does not change the page or remove the project when deletion fails', async () => {
    const { fixture, root, api } = await render(async (service) => {
      await seedExtraProjects(service, 5);
    });
    await settle(fixture);

    const page = fixture.componentInstance;
    page['page']({ first: 10, rows: 10 });
    fixture.detectChanges();
    expect(tiles(root)).toHaveLength(1);

    const remaining = page.visible()[0]!;
    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    vi.spyOn(api, 'remove').mockReturnValue(throwError(() => new Error('offline')));
    const toast = vi.spyOn(TestBed.inject(MessageService), 'add');

    await page['remove'](remaining);
    await settle(fixture);

    expect(page.first()).toBe(10);
    expect(page.items().some((project) => project.id === remaining.id)).toBe(true);
    expect(tiles(root)).toHaveLength(1);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'حدث خطأ' }),
    );
    expect(toast).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
  });

  it('switches tile copy with the UI language', async () => {
    const { fixture, root } = await render();
    await settle(fixture);
    const lang = TestBed.inject(LanguageService);
    lang.set('en');
    fixture.detectChanges();
    expect(root.textContent).toContain('Waslny');
    expect(root.textContent).toContain('Manage projects');
    expect(root.textContent).toContain('Showing');
    lang.set('ar');
  });
});
