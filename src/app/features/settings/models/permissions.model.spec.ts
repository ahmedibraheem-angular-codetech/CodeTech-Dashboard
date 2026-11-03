import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { authSession } from '../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../core/auth/auth.service';
import type { PermissionCatalogDto } from './permissions.api';
import {
  grantsFromPermissions,
  mapPermissionCatalog,
  permissionsFromGrants,
  permissionsFromModuleToggles,
  preservedPermissions,
  type PermissionCatalog,
} from './permissions.model';

const CATALOG_DTO: PermissionCatalogDto = {
  modules: [
    { key: 'home', label: 'الرئيسية' },
    { key: 'products', label: 'المنتجات', actions: ['view'] },
  ],
  actions: [
    { key: 'view', label: 'عرض' },
    { key: 'create', label: 'إضافة' },
    { key: 'update', label: 'تعديل' },
    { key: 'delete', label: 'حذف' },
  ],
};

function catalog(): PermissionCatalog {
  return mapPermissionCatalog(CATALOG_DTO);
}

describe('permission catalog mapping', () => {
  it('uses module keys from the catalog and limits actions a module declares', () => {
    const mapped = catalog();
    expect(mapped.modules.map((mod) => mod.key)).toEqual(['home', 'products']);
    expect(mapped.modules[0]?.actions).toEqual(['view', 'create', 'update', 'delete']);
    expect(mapped.modules[1]?.actions).toEqual(['view']);
    expect(mapped.actions.map((action) => action.key)).toEqual(['view', 'create', 'update', 'delete']);
  });

  it('orders catalog actions as view → create → update → delete without inventing keys', () => {
    const mapped = mapPermissionCatalog({
      modules: [{ key: 'home', label: 'Home' }],
      actions: [
        { key: 'delete', label: 'Delete' },
        { key: 'view', label: 'View' },
        { key: 'update', label: 'Update' },
        { key: 'create', label: 'Create' },
      ],
    });
    expect(mapped.actions.map((action) => action.key)).toEqual(['view', 'create', 'update', 'delete']);
  });

  it('does not invent a module that the catalog omitted', () => {
    const mapped = catalog();
    expect(mapped.modules.some((mod) => mod.key === 'settings')).toBe(false);
  });

  it('serializes delete and skips unsupported actions', () => {
    const mapped = catalog();
    const grants = grantsFromPermissions(mapped, ['home.view', 'products.create']);
    expect(grants['home']?.['view']).toBe(true);
    expect(grants['products']?.['create']).toBeUndefined();
    grants['home']['delete'] = true;
    grants['products']['create'] = true;

    const names = permissionsFromGrants(mapped, grants, ['legacy.custom']);
    expect(names).toEqual(['home.delete', 'home.view', 'legacy.custom']);
    expect(names.some((name) => name.endsWith('.remove'))).toBe(false);
  });

  it('turns a module switch into only that module’s supported actions', () => {
    const names = permissionsFromModuleToggles(catalog(), { home: true, products: true });
    expect(names).toContain('home.delete');
    expect(names).toContain('products.view');
    expect(names).not.toContain('products.delete');
    expect(names).not.toContain('products.remove');
  });

  it('keeps names outside the catalog when a role is saved', () => {
    const mapped = catalog();
    expect(preservedPermissions(mapped, ['home.view', 'custom.extra'])).toEqual(['custom.extra']);
  });

  it('matches the strings permission checks already use', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const auth = TestBed.inject(AuthService);
    auth.session.set(
      authSession({
        token: 't',
        email: 'a@b.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: ['products.delete', 'home.view'],
      }),
    );
    expect(auth.hasPermission('products.delete')).toBe(true);
    expect(auth.hasPermission('products.remove')).toBe(false);
    expect(auth.hasAll(['home.view'])).toBe(true);
  });
});
