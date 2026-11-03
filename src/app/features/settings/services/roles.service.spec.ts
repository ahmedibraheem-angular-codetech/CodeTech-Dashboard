import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_BASE_URL } from '../../../core/config/api';
import { isApiError } from '../../../core/http/api-error';
import { RolesService } from './roles.service';

const base = environment.apiUrl;

describe('RolesService', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: base },
      ],
    });
    return {
      api: TestBed.inject(RolesService),
      http: TestBed.inject(HttpTestingController),
    };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('loads the permission catalog', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(api.catalog());
    http.expectOne(`${base}/admin/permissions`).flush({
      data: {
        modules: [{ key: 'seo', label: 'SEO', actions: ['view'] }],
        actions: [
          { key: 'view', label: 'View' },
          { key: 'delete', label: 'Delete' },
        ],
      },
    });
    const catalog = await pending;
    expect(catalog.modules[0]?.actions).toEqual(['view']);
    expect(catalog.actions.map((action) => action.key)).toEqual(['view', 'delete']);
  });

  it('lists roles and loads one role’s permissions', async () => {
    const { api, http } = setup();
    const listed = firstValueFrom(api.list());
    http.expectOne(`${base}/admin/roles`).flush({
      data: [
        { id: 1, name: 'المدير العام', is_protected: true, users_count: 1 },
        { id: 2, name: 'مدير المحتوى', is_protected: false, users_count: 3 },
      ],
    });
    const roles = await listed;
    expect(roles[0]?.isProtected).toBe(true);
    expect(roles[0]?.permissions).toBeNull();
    expect(roles[1]?.usersCount).toBe(3);

    const detail = firstValueFrom(api.get('2'));
    http.expectOne(`${base}/admin/roles/2`).flush({
      data: {
        id: 2,
        name: 'مدير المحتوى',
        is_protected: false,
        users_count: 3,
        permissions: ['products.view', 'products.delete'],
      },
    });
    expect((await detail)?.permissions).toEqual(['products.view', 'products.delete']);
  });

  it('creates and updates with permission name arrays', async () => {
    const { api, http } = setup();
    const created = firstValueFrom(api.create('مدير المحتوى', ['services.delete']));
    const post = http.expectOne(`${base}/admin/roles`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      name: 'مدير المحتوى',
      permissions: ['services.delete'],
    });
    post.flush({
      data: {
        id: 4,
        name: 'مدير المحتوى',
        is_protected: false,
        users_count: 0,
        permissions: ['services.delete'],
      },
    });
    expect((await created).id).toBe('4');

    const updated = firstValueFrom(api.update('4', 'مدير المحتوى', ['home.view', 'home.delete']));
    const put = http.expectOne(`${base}/admin/roles/4`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.permissions).toEqual(['home.view', 'home.delete']);
    put.flush({
      data: {
        id: 4,
        name: 'مدير المحتوى',
        is_protected: false,
        users_count: 0,
        permissions: ['home.delete', 'home.view'],
      },
    });
    expect((await updated).permissions).toEqual(['home.delete', 'home.view']);
  });

  it('deletes a role that still has users', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(api.remove('2'));
    const req = http.expectOne(`${base}/admin/roles/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush('', { status: 204, statusText: 'No Content' });
    await pending;
  });

  it('returns null for a missing role and surfaces other API errors', async () => {
    const { api, http } = setup();
    const missing = firstValueFrom(api.get('9'));
    http.expectOne(`${base}/admin/roles/9`).flush({ message: 'missing' }, { status: 404, statusText: 'Not Found' });
    expect(await missing).toBeNull();

    const failed = firstValueFrom(api.list());
    http
      .expectOne(`${base}/admin/roles`)
      .flush({ message: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    try {
      await failed;
      throw new Error('expected failure');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      if (isApiError(error)) {
        expect(error.status).toBe(403);
      }
    }
  });
});
