import { inject } from '@angular/core';
import { type ActivatedRouteSnapshot, type CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import type { PermissionName } from '../auth/auth.model';
import { AuthService } from '../auth/auth.service';

function resolveRequired(
  route: ActivatedRouteSnapshot,
  explicit?: PermissionName | readonly PermissionName[],
): PermissionName[] {
  if (explicit !== undefined) {
    return normalizeNames(explicit);
  }
  const singular = route.data['permission'];
  if (typeof singular === 'string') {
    return singular ? [singular] : [];
  }
  const list = route.data['permissions'];
  if (Array.isArray(list)) {
    return list.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }
  return [];
}

function normalizeNames(value: PermissionName | readonly PermissionName[]): PermissionName[] {
  if (typeof value === 'string') {
    return value ? [value] : [];
  }
  return value.filter((item) => typeof item === 'string' && item.length > 0);
}

export function permissionGuard(
  required?: PermissionName | readonly PermissionName[],
): CanActivateFn {
  return (route) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const needed = resolveRequired(route, required);

    return auth.ensureSession().pipe(
      map((ok) => {
        if (!ok) {
          return router.createUrlTree(['/login']);
        }

        if (needed.length === 0 || !auth.hasAll(needed)) {
          return router.createUrlTree(['/forbidden']);
        }
        return true;
      }),
    );
  };
}
