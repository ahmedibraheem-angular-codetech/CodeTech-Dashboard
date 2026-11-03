import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { environment } from '../../../../../environments/environment';
import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { PermissionsPage } from './permissions';

const base = environment.apiUrl;
const ROLE_GRANTS = ['roles.view', 'roles.create', 'roles.update', 'roles.delete'] as const;

describe('PermissionsPage', () => {
  function render() {
    TestBed.configureTestingModule({
      imports: [PermissionsPage],
      providers: [MessageService, provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...ROLE_GRANTS],
      }),
    );
    const fixture = TestBed.createComponent(PermissionsPage);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${base}/admin/permissions`).flush({
      data: {
        modules: [
          { key: 'home', label: 'الرئيسية' },
          { key: 'products', label: 'المنتجات', actions: ['view'] },
        ],
        actions: [
          { key: 'delete', label: 'حذف' },
          { key: 'update', label: 'تعديل' },
          { key: 'create', label: 'إضافة' },
          { key: 'view', label: 'عرض' },
        ],
      },
    });
    http.expectOne(`${base}/admin/roles`).flush({
      data: [
        { id: 1, name: 'المدير العام', is_protected: true, users_count: 1 },
        { id: 2, name: 'مدير المحتوى', is_protected: false, users_count: 2 },
      ],
    });
    fixture.detectChanges();
    // Prefers the first editable (non-protected) role.
    http.expectOne(`${base}/admin/roles/2`).flush({
      data: {
        id: 2,
        name: 'مدير المحتوى',
        is_protected: false,
        users_count: 2,
        permissions: ['home.view'],
      },
    });
    fixture.detectChanges();
    return { fixture, http };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('renders the catalog matrix with view and a working role dropdown', () => {
    const { fixture } = render();
    const root: HTMLElement = fixture.nativeElement;
    const head = root.querySelector('.permissions-table__head')?.textContent ?? '';

    expect(root.querySelector('h1')?.textContent).toContain('التحكم في الاذونات');
    expect(root.textContent).toContain('الأدوار');
    expect(root.textContent).toContain('الرئيسية');
    expect(root.textContent).toContain('المنتجات');
    expect(head.indexOf('عرض')).toBeGreaterThanOrEqual(0);
    expect(head.indexOf('عرض')).toBeLessThan(head.indexOf('إضافة'));
    expect(head.indexOf('إضافة')).toBeLessThan(head.indexOf('تعديل'));
    expect(head.indexOf('تعديل')).toBeLessThan(head.indexOf('حذف'));
    expect(root.querySelectorAll('.permissions-table__row').length).toBe(2);
    expect(root.querySelectorAll('p-toggleswitch').length).toBe(5);
    expect(root.querySelector('p-select')).toBeTruthy();
    expect(root.querySelector('.permissions-role__tag')?.textContent).toContain('الدور');
    expect(fixture.componentInstance.selectedId()).toBe('2');
    expect(root.querySelector<HTMLButtonElement>('.permissions-save')?.disabled).toBe(false);
    expect(root.querySelectorAll('p-toggleswitch.p-disabled').length).toBe(0);
  });

  it('toggles grants and saves delete permissions without inventing actions', () => {
    const { fixture, http } = render();

    fixture.componentInstance.setGrant('products', 'delete', true);
    fixture.componentInstance.setGrant('home', 'delete', true);
    expect(fixture.componentInstance.grants()['home']?.['delete']).toBe(true);
    expect(fixture.componentInstance.grants()['products']?.['delete']).toBeUndefined();
    fixture.componentInstance.save();

    const req = http.expectOne(`${base}/admin/roles/2`);
    expect(req.request.method).toBe('PUT');
    const permissions = (req.request.body as { permissions: string[] }).permissions;
    expect(permissions).toContain('home.delete');
    expect(permissions).toContain('home.view');
    expect(permissions).not.toContain('products.delete');
    expect(permissions.some((name) => name.endsWith('.remove'))).toBe(false);
    req.flush({
      data: {
        id: 2,
        name: 'مدير المحتوى',
        is_protected: false,
        users_count: 2,
        permissions,
      },
    });
    fixture.detectChanges();
  });

  it('locks switches for a protected role while keeping save/delete visible', () => {
    const { fixture, http } = render();
    fixture.componentInstance.selectedId.set('1');
    fixture.detectChanges();
    http.expectOne(`${base}/admin/roles/1`).flush({
      data: {
        id: 1,
        name: 'المدير العام',
        is_protected: true,
        users_count: 1,
        permissions: ['home.view', 'home.create', 'home.update', 'home.delete', 'products.view'],
      },
    });
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector<HTMLButtonElement>('.permissions-save')?.disabled).toBe(true);
    expect(root.querySelector<HTMLButtonElement>('.permissions-delete')?.disabled).toBe(true);
    expect(root.querySelectorAll('p-toggleswitch.p-disabled').length).toBeGreaterThan(0);
  });

  it('opens the add-role dialog with catalog module labels', () => {
    const { fixture } = render();
    const root: HTMLElement = fixture.nativeElement;
    root.querySelector<HTMLButtonElement>('.permissions-add')?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.editorOpen()).toBe(true);
    expect(document.querySelectorAll('.permissions-module-card').length).toBe(2);
    expect(document.body.textContent).toContain('اسم الدور');
    expect(document.body.textContent).toContain('المنتجات');
  });

  it('shows an error state when the catalog request fails', () => {
    TestBed.configureTestingModule({
      imports: [PermissionsPage],
      providers: [MessageService, provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...ROLE_GRANTS],
      }),
    );
    const fixture = TestBed.createComponent(PermissionsPage);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${base}/admin/roles`).flush({ data: [] });
    http
      .expectOne(`${base}/admin/permissions`)
      .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('حدث خطأ');
  });
});
