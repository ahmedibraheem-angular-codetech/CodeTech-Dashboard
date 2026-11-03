import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, of, throwError } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { apiUrl } from '../../../../core/config/api';
import { ApiError } from '../../../../core/http/api-error';
import { LanguageService } from '../../../../core/services/language.service';
import type { Project } from '../../models/project.model';
import { mapProjectListItem } from '../../services/project.mapper';
import { ProjectsService } from '../../services/projects.service';
import {
  paginated,
  projectDetailDto,
  projectListDto,
  projectsPageDto,
} from '../../projects.spec-helpers';
import { ProjectsList } from './projects-list';

const LIST = apiUrl(environment.apiUrl, 'admin/projects');
const PAGE = apiUrl(environment.apiUrl, 'admin/pages/projects');

const PROJECT_GRANTS = [
  'projects.view',
  'projects.create',
  'projects.update',
  'projects.delete',
] as const;

describe('ProjectsList (HTTP)', () => {
  let http: HttpTestingController;

  async function settle<T>(fixture: { detectChanges(): void; whenStable(): Promise<void> } & T) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function flushBoard(items = [1, 2, 3, 4, 5, 6].map((id) => projectListDto(id)), visible = true) {
    const listReq = http.expectOne(
      (request) => request.url.startsWith(LIST) && request.method === 'GET',
    );
    listReq.flush(paginated(items, LIST));
    const pageReq = http.expectOne(PAGE);
    pageReq.flush({
      data: projectsPageDto({
        sections: { stats_visible: false, projects_visible: visible },
      }),
    });
  }

  async function render() {
    TestBed.configureTestingModule({
      imports: [ProjectsList],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
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
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ProjectsList);
    fixture.detectChanges();
    return {
      fixture,
      root: fixture.nativeElement as HTMLElement,
      api: TestBed.inject(ProjectsService),
    };
  }

  const tiles = (root: HTMLElement) => root.querySelectorAll('.project-tile');
  const confirmOf = (fixture: { componentRef: { instance: ProjectsList } }) =>
    fixture.componentRef.instance['confirm']();

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    http?.verify();
    TestBed.resetTestingModule();
  });

  it('shows the loading state until the projects arrive', async () => {
    const { fixture, root } = await render();
    expect(root.querySelector('app-state-view p-progress-spinner')).not.toBeNull();
    expect(tiles(root)).toHaveLength(0);
    flushBoard();
    await settle(fixture);
    expect(root.querySelector('app-state-view')).toBeNull();
    expect(tiles(root)).toHaveLength(6);
  });

  it('renders the project catalog with distinct tiles', async () => {
    const { fixture, root } = await render();
    flushBoard([
      projectListDto(1, { title: { ar: 'وصلني', en: 'Waslny' } }),
      ...[2, 3, 4, 5, 6].map((id) => projectListDto(id)),
    ]);
    await settle(fixture);
    expect(root.textContent).toContain('إدارة المشاريع');
    expect(root.textContent).toContain('وصلني');
    expect(tiles(root)).toHaveLength(6);
    expect(root.querySelector('a[href="/projects/new"]')).not.toBeNull();
    expect(fixture.componentInstance.status()).toBe('ready');
  });

  it('renders a usable cover URL as an image src', async () => {
    const { fixture, root } = await render();
    flushBoard([
      projectListDto(1, {
        cover: { ...projectListDto(1).cover!, url: '/images/project-cover.jpg' },
      }),
    ]);
    await settle(fixture);
    const cover = root.querySelector('.project-tile a.project-tile__media[href="/projects/1"] img');
    expect(cover?.getAttribute('src')).toBe('/images/project-cover.jpg');
  });

  it('omits cover images for empty, whitespace, and icon cover values', async () => {
    const { fixture, root } = await render();
    flushBoard([
      projectListDto(1, {
        title: { ar: 'غلاف صالح', en: 'Valid' },
        cover: { ...projectListDto(1).cover!, url: '/images/project-cover.jpg' },
      }),
      projectListDto(2, { title: { ar: 'غلاف فارغ', en: 'Empty' }, cover: null }),
      projectListDto(3, {
        title: { ar: 'غلاف أيقونة', en: 'Icon' },
        cover: { ...projectListDto(1).cover!, url: 'icon:pi-image' },
      }),
    ]);
    await settle(fixture);

    expect(tiles(root)).toHaveLength(3);
    const media = (id: string) =>
      root.querySelector(`.project-tile a.project-tile__media[href="/projects/${id}"]`);
    expect(media('1')?.querySelector('img')?.getAttribute('src')).toBe('/images/project-cover.jpg');
    expect(media('2')?.querySelector('img')).toBeNull();
    expect(media('3')?.querySelector('img')).toBeNull();
  });

  it('shows the empty state after a successful load with no projects', async () => {
    const { fixture, root } = await render();
    flushBoard([]);
    await settle(fixture);
    expect(tiles(root)).toHaveLength(0);
    expect(root.querySelector('app-state-view .pi-inbox')).not.toBeNull();
    expect(root.textContent).toContain('لا توجد مشاريع بعد');
  });

  it('shows an error instead of the empty state when loading fails', async () => {
    TestBed.configureTestingModule({
      imports: [ProjectsList],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const api = TestBed.inject(ProjectsService);
    vi.spyOn(api, 'listAll').mockReturnValue(throwError(() => new Error('offline')));
    vi.spyOn(api, 'loadCatalogVisibility').mockReturnValue(throwError(() => new Error('offline')));
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ProjectsList);
    fixture.detectChanges();
    await settle(fixture);
    const root: HTMLElement = fixture.nativeElement;

    expect(fixture.componentInstance.status()).toBe('error');
    expect(root.querySelector('app-state-view .pi-exclamation-circle')).not.toBeNull();
    expect(tiles(root)).toHaveLength(0);
  });

  it('shows SectionEmpty offline state for a network ApiError on first load', async () => {
    TestBed.configureTestingModule({
      imports: [ProjectsList],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const api = TestBed.inject(ProjectsService);
    vi.spyOn(api, 'listAll').mockReturnValue(throwError(() => new ApiError(0, null)));
    vi.spyOn(api, 'loadCatalogVisibility').mockReturnValue(throwError(() => new ApiError(0, null)));
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ProjectsList);
    fixture.detectChanges();
    await settle(fixture);
    const root: HTMLElement = fixture.nativeElement;

    expect(fixture.componentInstance.status()).toBe('offline');
    expect(root.querySelector('app-section-empty')).not.toBeNull();
    expect(root.querySelector('app-state-view .pi-exclamation-circle')).toBeNull();
    expect(root.querySelector('app-state-view .pi-inbox')).toBeNull();
    expect(root.textContent).toContain('لا يوجد اتصال بالإنترنت');
  });

  it('retries after a load failure and shows the catalog on success', async () => {
    TestBed.configureTestingModule({
      imports: [ProjectsList],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const api = TestBed.inject(ProjectsService);
    const list = vi.spyOn(api, 'listAll').mockReturnValue(throwError(() => new Error('offline')));
    vi.spyOn(api, 'loadCatalogVisibility').mockImplementation(() => {
      api.catalogVisible.set(true);
      return of(true);
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ProjectsList);
    fixture.detectChanges();
    await settle(fixture);
    expect(fixture.componentInstance.status()).toBe('error');

    const next = new Subject<Project[]>();
    list.mockReturnValueOnce(next.asObservable());
    fixture.componentInstance['retry']();
    expect(fixture.componentInstance.status()).toBe('loading');
    next.next([1, 2, 3, 4, 5, 6].map((id) => mapProjectListItem(projectListDto(id))));
    next.complete();
    await settle(fixture);

    expect(fixture.componentInstance.status()).toBe('ready');
    expect(tiles(fixture.nativeElement)).toHaveLength(6);
  });

  it('ignores a stale list response after a newer load has started', async () => {
    TestBed.configureTestingModule({
      imports: [ProjectsList],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const api = TestBed.inject(ProjectsService);
    const first = new Subject<Project[]>();
    const second = new Subject<Project[]>();
    let calls = 0;
    vi.spyOn(api, 'listAll').mockImplementation(() => {
      calls += 1;
      return calls === 1 ? first.asObservable() : second.asObservable();
    });
    vi.spyOn(api, 'loadCatalogVisibility').mockImplementation(() => {
      api.catalogVisible.set(true);
      return of(true);
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ProjectsList);
    fixture.detectChanges();

    fixture.componentInstance['retry']();
    const newer = [1, 2].map((id) => mapProjectListItem(projectListDto(id)));
    second.next(newer);
    second.complete();
    await settle(fixture);
    expect(fixture.componentInstance.items()).toEqual(newer);

    first.next([1, 2, 3, 4, 5, 6].map((id) => mapProjectListItem(projectListDto(id))));
    first.complete();
    await settle(fixture);
    expect(fixture.componentInstance.items()).toEqual(newer);
  });

  it('shows empty state when the catalog is hidden', async () => {
    const { fixture, root } = await render();
    flushBoard(undefined, false);
    await settle(fixture);
    expect(root.textContent).toContain('لا توجد مشاريع بعد');
    expect(tiles(root)).toHaveLength(0);
  });

  it('publishes through setPublished Observable', async () => {
    const { fixture, root } = await render();
    flushBoard([projectListDto(1)]);
    await settle(fixture);

    fixture.componentInstance['publish']('1', false);
    const req = http.expectOne(`${LIST}/1/status`);
    expect(req.request.body).toEqual({ status: 'draft' });
    req.flush({ data: projectDetailDto(1, { status: 'draft' }) });
    await settle(fixture);
    expect(fixture.componentInstance.items()[0]?.published).toBe(false);
    expect(tiles(root)).toHaveLength(1);
  });

  it('cancels delete when the confirm dialog is declined', async () => {
    const { fixture, root } = await render();
    flushBoard();
    await settle(fixture);
    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(false);
    await fixture.componentInstance['remove'](fixture.componentInstance.items()[0]!);
    fixture.detectChanges();
    expect(tiles(root)).toHaveLength(6);
  });

  it('does not report a successful deletion when the remove request fails', async () => {
    const { fixture, api, root } = await render();
    flushBoard();
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
  });

  it('paginates long lists and steps back when the last card of a page is removed', async () => {
    const { fixture, root } = await render();
    flushBoard([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((id) => projectListDto(id)));
    await settle(fixture);
    expect(tiles(root)).toHaveLength(10);

    const page = fixture.componentInstance;
    page['page']({ first: 10, rows: 10 });
    fixture.detectChanges();
    expect(tiles(root)).toHaveLength(1);

    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    const removing = page['remove'](page.visible()[0]!);
    await Promise.resolve();
    http.expectOne(`${LIST}/11`).flush('');
    await removing;
    await settle(fixture);

    expect(page.first()).toBe(0);
    expect(tiles(root)).toHaveLength(10);
  });

  it('keeps the current page when other items remain after a deletion', async () => {
    const { fixture, root } = await render();
    flushBoard([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((id) => projectListDto(id)));
    await settle(fixture);

    const page = fixture.componentInstance;
    page['page']({ first: 10, rows: 10 });
    fixture.detectChanges();
    expect(tiles(root)).toHaveLength(2);

    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    const removing = page['remove'](page.visible()[0]!);
    await Promise.resolve();
    http.expectOne(`${LIST}/11`).flush('');
    await removing;
    await settle(fixture);

    expect(page.first()).toBe(10);
    expect(tiles(root)).toHaveLength(1);
  });

  it('stays on a valid page and shows the empty state after deleting the final project', async () => {
    const { fixture, root } = await render();
    flushBoard([projectListDto(1)]);
    await settle(fixture);
    expect(tiles(root)).toHaveLength(1);

    const page = fixture.componentInstance;
    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    const removing = page['remove'](page.items()[0]!);
    await Promise.resolve();
    http.expectOne(`${LIST}/1`).flush('');
    await removing;
    await settle(fixture);

    expect(page.first()).toBe(0);
    expect(tiles(root)).toHaveLength(0);
    expect(root.querySelector('app-state-view')?.textContent).toContain('لا توجد مشاريع بعد');
  });

  it('switches tile copy with the UI language', async () => {
    const { fixture, root } = await render();
    flushBoard([
      projectListDto(1, {
        title: { ar: 'وصلني', en: 'Waslny' },
        description: { ar: 'وصف', en: 'Desc' },
      }),
    ]);
    await settle(fixture);
    const lang = TestBed.inject(LanguageService);
    lang.set('en');
    fixture.detectChanges();
    expect(root.textContent).toContain('Waslny');
    expect(root.textContent).toContain('Manage projects');
    lang.set('ar');
  });
});
