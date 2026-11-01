import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';

import type { PermissionName } from '../../core/auth/auth.model';
import { AuthService } from '../../core/auth/auth.service';

export type PermissionMatchMode = 'any' | 'all';

@Directive({
  selector: '[appHasPermission]',
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  readonly appHasPermission = input.required<PermissionName | readonly PermissionName[]>();

  readonly appHasPermissionMode = input<PermissionMatchMode>('any');

  private hasView = false;

  constructor() {
    effect(() => {
      const allowed = this.isAllowed();
      if (allowed && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!allowed && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }

  private isAllowed(): boolean {
    const session = this.auth.session();

    if (!session?.profileLoaded) {
      return false;
    }
    const required = this.normalize(this.appHasPermission());
    if (required.length === 0) {
      return false;
    }
    return this.appHasPermissionMode() === 'all'
      ? this.auth.hasAll(required)
      : this.auth.hasAny(required);
  }

  private normalize(value: PermissionName | readonly PermissionName[]): PermissionName[] {
    if (typeof value === 'string') {
      return value.length > 0 ? [value] : [];
    }
    return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }
}
