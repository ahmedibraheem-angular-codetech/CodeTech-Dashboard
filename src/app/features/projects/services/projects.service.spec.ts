import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/config/api';
import { blankProject, localeText } from '../models/project.model';
import {
  fileDto,
  paginated,
  projectDetailDto,
  projectListDto,
  projectsPageDto,
} from '../testing/projects.memory';
import { ProjectsService } from './projects.service';

const LIST = apiUrl(environment.apiUrl, 'admin/projects');
const PAGE = apiUrl(environment.apiUrl, 'admin/pages/projects');
const MEDIA = apiUrl(environment.apiUrl, 'admin/media');
const PRODUCTS = apiUrl(environment.apiUrl, 'admin/products');

describe('ProjectsService (HTTP)', () => {
  let service: ProjectsService;
  let http: HttpTestingController;

  async function expectRequest(url: string) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const matches = http.match(url);
      if (matches.length === 1) {
        return matches[0];
      }
      if (matches.length > 1) {
        return http.expectOne(url);
      }
      await Promise.resolve();
    }
    return http.expectOne(url);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lists paginated projects on admin/projects only', async () => {
    const result = firstValueFrom(service.list({ perPage: 10 }));
    const req = await expectRequest(`${LIST}?per_page=10`);
    expect(req.request.method).toBe('GET');
    expect(req.request.url).toContain('admin/projects');
    expect(req.request.url).not.toContain('admin/products');
    req.flush(paginated([projectListDto(7)], LIST, 1, 10));
    expect((await result)[0]?.id).toBe('7');
    http.expectNone(PRODUCTS);
  });

  it('listAll walks pages without hitting products', async () => {
    const result = firstValueFrom(service.listAll({ perPage: 1 }));
    const first = await expectRequest(`${LIST}?page=1&per_page=1`);
    first.flush({
      data: [projectListDto(1)],
      links: { first: null, last: null, prev: null, next: null },
      meta: {
        current_page: 1,
        from: 1,
        last_page: 2,
        path: LIST,
        per_page: 1,
        to: 1,
        total: 2,
      },
    });
    const second = await expectRequest(`${LIST}?page=2&per_page=1`);
    second.flush({
      data: [projectListDto(2)],
      links: { first: null, last: null, prev: null, next: null },
      meta: {
        current_page: 2,
        from: 2,
        last_page: 2,
        path: LIST,
        per_page: 1,
        to: 2,
        total: 2,
      },
    });
    const items = await result;
    expect(items.map((item) => item.id)).toEqual(['1', '2']);
    http.expectNone((request) => request.url.includes('admin/products'));
  });

  it('loads detail and returns null on 404', async () => {
    const result = firstValueFrom(service.get('7'));
    (await expectRequest(`${LIST}/7`)).flush({ data: projectDetailDto(7) });
    expect((await result)?.identityButtons[0]?.images).toHaveLength(4);

    const missing = firstValueFrom(service.get('404'));
    http
      .expectOne(`${LIST}/404`)
      .flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    expect(await missing).toBeNull();
  });

  it('creates a project with mapped write body', async () => {
    const draft = {
      ...blankProject(),
      name: localeText('مشروع', 'Project'),
      summary: localeText('وصف', 'Desc'),
      categories: [],
      aboutCards: [],
      challenges: [],
      tools: [],
      solutions: [],
      gallery: [],
      features: [],
      results: [],
      identityButtons: [],
    };
    const result = firstValueFrom(service.save(draft));
    const req = await expectRequest(LIST);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toEqual({ ar: 'مشروع', en: 'Project' });
    expect(req.request.body).not.toHaveProperty('products');
    expect(req.request.body).not.toHaveProperty('services');
    req.flush({ data: projectDetailDto(9) }, { status: 201, statusText: 'Created' });
    expect((await result).id).toBe('9');
  });

  it('uploads blob media then PUTs coat-check UUID', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Blob(['x'], { type: 'image/png' }), { status: 200 })),
    );
    const draft = {
      ...blankProject(),
      id: '7',
      name: localeText('مشروع', 'Project'),
      summary: localeText('وصف', 'Desc'),
      cover: {
        ar: { imageUrl: 'blob:https://local/cover', imageName: 'cover.png', imageUuid: null },
        en: { imageUrl: '', imageName: '', imageUuid: null },
      },
      categories: [],
      aboutCards: [],
      challenges: [],
      tools: [],
      solutions: [],
      gallery: [],
      features: [],
      results: [],
      identityButtons: [],
    };
    const result = firstValueFrom(service.save(draft));
    const upload = await expectRequest(MEDIA);
    expect(upload.request.method).toBe('POST');
    upload.flush({ data: fileDto({ uuid: 'uploaded-cover' }) });
    const put = await expectRequest(`${LIST}/7`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.cover).toBe('uploaded-cover');
    put.flush({ data: projectDetailDto(7) });
    await result;
    vi.unstubAllGlobals();
  });

  it('publishes through the status endpoint', async () => {
    const result = firstValueFrom(service.setPublished('7', false));
    const req = await expectRequest(`${LIST}/7/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'draft' });
    req.flush({ data: projectDetailDto(7, { status: 'draft' }) });
    expect((await result).published).toBe(false);
  });

  it('removes a project', async () => {
    const remove = firstValueFrom(service.remove('7'));
    http.expectOne(`${LIST}/7`).flush('');
    await remove;
  });

  it('loads catalog visibility from the projects page', async () => {
    const result = firstValueFrom(service.loadCatalogVisibility());
    const req = await expectRequest(PAGE);
    req.flush({
      data: projectsPageDto({ sections: { stats_visible: true, projects_visible: true } }),
    });
    expect(await result).toBe(true);
    expect(service.catalogVisible()).toBe(true);
  });

  it('toggles catalog via projects_visible sections patch', () => {
    service.catalogVisible.set(true);
    service.toggleCatalog();
    expect(service.catalogVisible()).toBe(false);
    const req = http.expectOne(`${PAGE}/sections`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ projects_visible: false });
    req.flush({
      data: projectsPageDto({ sections: { stats_visible: false, projects_visible: false } }),
    });
  });
});
