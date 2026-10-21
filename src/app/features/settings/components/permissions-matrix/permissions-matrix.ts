import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import type { PermissionAction, PermissionResource } from '../../models/permissions.model';

export interface PermissionsRoleOption {
  value: string;
  label: string;
}

export interface PermissionsGrantChange {
  resourceId: string;
  action: PermissionAction;
  value: boolean;
}

/**
 * Roles matrix panel: role select, save/delete actions, and resource×action toggles.
 * Parent owns role records and persistence.
 */
@Component({
  selector: 'app-permissions-matrix',
  imports: [FormsModule, AppButton, Select, ToggleSwitch],
  templateUrl: './permissions-matrix.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsMatrix {
  readonly lang = inject(LanguageService);

  readonly resources = input.required<readonly PermissionResource[]>();
  readonly actions = input.required<readonly PermissionAction[]>();
  readonly roleOptions = input.required<PermissionsRoleOption[]>();
  readonly grants = input.required<Record<string, Record<PermissionAction, boolean>>>();
  readonly canDelete = input(false);
  readonly selectedId = model.required<string>();

  readonly save = output<void>();
  readonly remove = output<void>();
  readonly grantChange = output<PermissionsGrantChange>();

  protected actionLabel(action: PermissionAction): string {
    if (action === 'create') {
      return this.lang.t('home.add');
    }
    if (action === 'update') {
      return this.lang.t('product.editAction');
    }
    return this.lang.t('about.delete');
  }

  protected resourceLabel(resource: PermissionResource): string {
    const label = this.lang.t(resource.labelKey);
    return resource.groupKey ? `${this.lang.t(resource.groupKey)} (${label})` : label;
  }

  protected granted(resourceId: string, action: PermissionAction): boolean {
    return this.grants()[resourceId]?.[action] ?? false;
  }

  protected setGrant(resourceId: string, action: PermissionAction, value: boolean): void {
    this.grantChange.emit({ resourceId, action, value });
  }
}
