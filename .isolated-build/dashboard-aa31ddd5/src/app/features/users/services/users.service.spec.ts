import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_BASE_URL } from '../../../core/config/api';
import { isApiError } from '../../../core/http/api-error';
import type { UserDto } from '../models/user.api';
import type { UserDraft } from '../models/user.model';
import { UsersService } from './users.service';

const base = environment.apiUrl;
const roles = [{ id: 2, name: 'مدير المحتوى', isProtected: false }];

function userDto(overrides: Partial<UserDto> = {}): UserDto {
  return {
    id: 7,
    code: 'USE-00007',
    name: 'يوسف احمد',
    username: null,
    email: 'yousef@codetech.test',
    phone: '+966 55 000 0000',
    status: 'active',
    role: { id: 2, name: 'مدير المحتوى', is_protected: false },
    avatar: null,
    blocked_reason: null,
    blocked_at: null,
    last_login_at: null,
    last_activity_at: '2026-10-29T10:12:00.000000Z',
    created_at: '2026-10-20T08:00:00.000000Z',
    updated_at: '2026-10-29T09:30:00.000000Z',
    ...overrides,
  };
}

function page(data: UserDto[], total = data.length, lastPage = 1) {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: 1,
      from: data.length ? 1 : null,
      last_page: lastPage,
      path: `${base}/admin/users`,
      per_page: 10,
      to: data.length,
      total,
    },
  };
}

describe('UsersService', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: base },
      ],
    });
    return {
      api: TestBed.inject(UsersService),
      http: TestBed.inject(HttpTestingController),
    };
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('lists a page with search, status and role filters', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(
      api.list({ page: 2, perPage: 10, search: 'يوسف', status: 'blocked', roleId: 2 }),
    );
    const req = http.expectOne(
      (call) => call.url === `${base}/admin/users` && call.params.get('page') === '2',
    );
    expect(req.request.params.get('search')).toBe('يوسف');
    expect(req.request.params.get('filter[status]')).toBe('blocked');
    expect(req.request.params.get('filter[role]')).toBe('2');
    expect(req.request.params.get('per_page')).toBe('10');
    req.flush(page([userDto({ status: 'blocked' })], 12, 2));
    const result = await pending;
    expect(result.total).toBe(12);
    expect(result.items[0]?.status).toBe('blocked');
    expect(result.items[0]?.role?.id).toBe(2);
  });

  it('loads statistics', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(api.stats());
    http.expectOne(`${base}/admin/users/stats`).flush({
      data: {
        total: { value: 20, previous: 18, change_pct: 11.1 },
        active: { value: 15, previous: 14, change_pct: 7.1 },
        inactive: { value: 3, previous: null, change_pct: null },
        blocked: { value: 2, previous: 1, change_pct: 100 },
      },
    });
    const stats = await pending;
    expect(stats.total.value).toBe(20);
    expect(stats.inactive.changePct).toBeNull();
  });

  it('loads roles for assignment', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(api.roles());
    http.expectOne(`${base}/admin/roles`).flush({
      data: [
        { id: 1, name: 'المدير العام', is_protected: true },
        { id: 2, name: 'مدير المحتوى', is_protected: false },
      ],
    });
    const list = await pending;
    expect(list.map((role) => role.id)).toEqual([1, 2]);
    expect(list[0]?.isProtected).toBe(true);
  });

  it('loads a user and treats a missing one as empty', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(api.get('7'));
    http.expectOne(`${base}/admin/users/7`).flush({ data: userDto({ role: null }) });
    const user = await pending;
    expect(user?.role).toBeNull();
    expect(user?.code).toBe('USE-00007');

    const missing = firstValueFrom(api.get('99'));
    http.expectOne(`${base}/admin/users/99`).flush({ message: 'missing' }, { status: 404, statusText: 'Not Found' });
    expect(await missing).toBeNull();
  });

  it('creates a user with role_id after uploading a new avatar', async () => {
    const { api, http } = setup();
    const draft: UserDraft = {
      name: 'يوسف',
      email: 'yousef@codetech.test',
      phone: '+966 55 000 0000',
      roleId: 2,
      status: 'active',
      avatar: new File(['img'], 'avatar.png', { type: 'image/png' }),
    };
    const pending = firstValueFrom(api.create(draft, roles));
    const upload = http.expectOne(`${base}/admin/media`);
    expect(upload.request.body.get('type')).toBe('image');
    upload.flush({
      data: {
        uuid: 'media-1',
        name: 'avatar',
        file_name: 'avatar.png',
        mime_type: 'image/png',
        size: 3,
        url: 'https://cdn.example/avatar.png',
        download_url: 'https://cdn.example/avatar.png',
        created_at: '2026-10-29T10:00:00.000000Z',
      },
    });
    const created = http.expectOne(`${base}/admin/users`);
    expect(created.request.method).toBe('POST');
    expect(created.request.body).toEqual({
      name: 'يوسف',
      email: 'yousef@codetech.test',
      phone: '+966 55 000 0000',
      status: 'active',
      role_id: 2,
      avatar: 'media-1',
    });
    created.flush({ data: userDto() });
    expect((await pending).id).toBe('7');
  });

  it('patches a user without an avatar field when the photo is unchanged', async () => {
    const { api, http } = setup();
    const draft: UserDraft = {
      name: 'يوسف',
      email: 'yousef@codetech.test',
      phone: '',
      roleId: 2,
      status: 'inactive',
    };
    const pending = firstValueFrom(api.update('7', draft, roles));
    const req = http.expectOne(`${base}/admin/users/7`);
    expect(req.request.method).toBe('PATCH');
    expect(Object.keys(req.request.body as object).sort()).toEqual([
      'email',
      'name',
      'phone',
      'role_id',
      'status',
    ]);
    expect((req.request.body as { phone: string | null }).phone).toBeNull();
    expect((req.request.body as { status: string }).status).toBe('inactive');
    req.flush({ data: userDto({ status: 'inactive', phone: null, username: 'kept' }) });
    const user = await pending;
    expect(user.username).toBe('kept');
    expect(user.status).toBe('inactive');
  });

  it('sends null avatar when the photo is removed', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(
      api.update(
        '7',
        {
          name: 'يوسف',
          email: 'yousef@codetech.test',
          phone: '+966550000000',
          roleId: 2,
          status: 'active',
          avatar: null,
        },
        roles,
      ),
    );
    const req = http.expectOne(`${base}/admin/users/7`);
    expect((req.request.body as { avatar: null }).avatar).toBeNull();
    req.flush({ data: userDto() });
    await pending;
  });

  it('refuses a role id that is not in the catalog', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(
      api.create(
        {
          name: 'يوسف',
          email: 'yousef@codetech.test',
          phone: '',
          roleId: 99,
          status: 'active',
        },
        roles,
      ),
    );
    await expect(pending).rejects.toThrow('invalid-role');
    http.expectNone(`${base}/admin/users`);
  });

  it('patches status in the body and keeps an omitted reason', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(api.setStatus('7', 'blocked', '  مخالفة  '));
    const req = http.expectOne(`${base}/admin/users/7/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'blocked', reason: 'مخالفة' });
    req.flush({
      data: userDto({
        status: 'blocked',
        blocked_reason: 'مخالفة',
        blocked_at: '2026-10-29T11:00:00.000000Z',
      }),
    });
    const user = await pending;
    expect(user.status).toBe('blocked');
    expect(user.blockedReason).toBe('مخالفة');

    const clear = firstValueFrom(api.setStatus('7', 'active'));
    const next = http.expectOne(`${base}/admin/users/7/status`);
    expect(next.request.body).toEqual({ status: 'active' });
    next.flush({ data: userDto({ status: 'active' }) });
    expect((await clear).status).toBe('active');
  });

  it('deletes a user and exports with the same filters', async () => {
    const { api, http } = setup();
    const removed = firstValueFrom(api.remove('7'));
    const del = http.expectOne(`${base}/admin/users/7`);
    expect(del.request.method).toBe('DELETE');
    del.flush('', { status: 204, statusText: 'No Content' });
    await removed;

    const exported = firstValueFrom(api.exportCsv({ search: 'يوسف', status: 'active', roleId: 2 }));
    const req = http.expectOne(
      (call) => call.url === `${base}/admin/users/export` && call.params.get('filter[role]') === '2',
    );
    expect(req.request.params.get('filter[status]')).toBe('active');
    expect(req.request.params.get('page')).toBeNull();
    req.flush(new Blob(['id,name']));
    const blob = await exported;
    expect(blob.size).toBeGreaterThan(0);
  });

  it('surfaces API failures', async () => {
    const { api, http } = setup();
    const pending = firstValueFrom(api.stats());
    http.expectOne(`${base}/admin/users/stats`).flush(
      { message: 'forbidden', errors: { role_id: ['Invalid role'] } },
      { status: 422, statusText: 'Unprocessable' },
    );
    try {
      await pending;
      throw new Error('expected failure');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      if (isApiError(error)) {
        expect(error.status).toBe(422);
        expect(error.fieldErrors['role_id']).toEqual(['Invalid role']);
      }
    }
  });
});
