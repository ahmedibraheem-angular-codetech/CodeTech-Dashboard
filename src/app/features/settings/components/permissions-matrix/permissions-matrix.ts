import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import type {
  CatalogAction,
  CatalogModule,
  PermissionGrants,
} from '../../models/permissions.model';

export interface PermissionsRoleOption {
  value: string;
  label: string;
}

export interface PermissionsGrantChange {
  moduleKey: string;
  action: string;
  value: boolean;
}

@Component({
  selector: 'app-permissions-matrix',
  imports: [FormsModule, AppButton, Select, ToggleSwitch],
  templateUrl: './permissions-matrix.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsMatrix {
  readonly lang = inject(LanguageService);

  readonly modules = input.required<readonly CatalogModule[]>();
  readonly actions = input.required<readonly CatalogAction[]>();
  readonly roleOptions = input.required<PermissionsRoleOption[]>();
  readonly grants = input.required<PermissionGrants>();

  readonly canDelete = input(false);
  readonly showUpdate = input(true);
  readonly showDelete = input(true);
  readonly locked = input(false);
  readonly selectedId = model.required<string>();

  readonly save = output<void>();
  readonly remove = output<void>();
  readonly grantChange = output<PermissionsGrantChange>();

  readonly canEdit = computed(() => this.showUpdate() && !this.locked());

  protected gridTemplate(): string {
    const cols = Math.max(this.actions().length, 1);
    return `minmax(200px, 1.6fr) repeat(${cols}, minmax(96px, 1fr))`;
  }

  protected actionLabel(action: CatalogAction): string {
    if (action.label.trim()) {
      return action.label;
    }
    switch (action.key) {
      case 'view':
        return this.lang.t('users.view');
      case 'create':
        return this.lang.t('home.add');
      case 'update':
        return this.lang.t('product.editAction');
      case 'delete':
        return this.lang.t('about.delete');
      default:
        return action.key;
    }
  }

  protected supports(module: CatalogModule, actionKey: string): boolean {
    return module.actions.includes(actionKey);
  }

  protected granted(moduleKey: string, actionKey: string): boolean {
    return this.grants()[moduleKey]?.[actionKey] === true;
  }

  protected onRoleChange(value: unknown): void {
    const next = value == null ? '' : String(value);
    if (next !== this.selectedId()) {
      this.selectedId.set(next);
    }
  }

  protected setGrant(moduleKey: string, actionKey: string, value: boolean): void {
    if (!this.canEdit()) {
      return;
    }
    this.grantChange.emit({ moduleKey, action: actionKey, value });
  }
}
