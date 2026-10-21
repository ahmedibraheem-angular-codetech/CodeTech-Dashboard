import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MessageService } from 'primeng/api';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PermissionsMatrix } from '../../components/permissions-matrix/permissions-matrix';
import { PermissionsRoleForm } from '../../components/permissions-role-form/permissions-role-form';
import {
  PERMISSION_ACTIONS,
  PERMISSION_DRAFT_SEED,
  PERMISSION_MODULES,
  PERMISSION_RESOURCES,
  emptyPermissionGrants,
  permissionGrants,
  permissionGrantsFromModules,
  type PermissionAction,
  type PermissionRole,
} from '../../models/permissions.model';

/**
 * Permissions page container: owns role state, create/delete/save workflows,
 * and composes the matrix panel plus add-role modal form.
 */
@Component({
  selector: 'app-permissions-page',
  imports: [PageHeader, AppButton, ConfirmDialog, Modal, PermissionsMatrix, PermissionsRoleForm],
  templateUrl: './permissions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsPage {
  private readonly messages = inject(MessageService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);

  readonly resources = PERMISSION_RESOURCES;
  readonly modules = PERMISSION_MODULES;
  readonly actions = PERMISSION_ACTIONS;
  readonly roles = signal<PermissionRole[]>([
    {
      id: 'super-admin',
      labelKey: 'settings.roleSuperAdmin',
      grants: permissionGrants({
        home: [true, true, true],
        about: [false, false, true],
        inquiries: [true, false, true],
        start: [false, false, false],
        products: [false, false, true],
        projects: [true, true, true],
        knowledge: [false, false, false],
        reviews: [false, false, true],
        settings: [false, false, true],
        support: [false, false, false],
        seo: [true, true, true],
      }),
    },
    {
      id: 'editor',
      labelKey: 'roles.editor',
      grants: permissionGrants({
        home: [true, true, false],
        about: [true, true, false],
        inquiries: [true, true, false],
        start: [true, true, false],
        products: [true, true, false],
        projects: [true, true, false],
        knowledge: [true, true, false],
        reviews: [true, true, false],
        settings: [false, false, false],
        support: [false, false, false],
        seo: [true, true, false],
      }),
    },
    {
      id: 'viewer',
      labelKey: 'roles.viewer',
      grants: emptyPermissionGrants(),
    },
  ]);
  readonly selectedId = signal('super-admin');
  readonly editorOpen = signal(false);
  readonly draftName = signal('');
  readonly draftModules = signal<Record<string, boolean>>({ ...PERMISSION_DRAFT_SEED });

  readonly selected = computed(
    () => this.roles().find((role) => role.id === this.selectedId()) ?? this.roles()[0],
  );
  readonly roleOptions = computed(() =>
    this.roles().map((role) => ({
      value: role.id,
      label: role.labelKey ? this.lang.t(role.labelKey) : (role.name ?? role.id),
    })),
  );

  protected setGrant(resourceId: string, action: PermissionAction, value: boolean): void {
    const current = this.selected();
    if (!current) {
      return;
    }
    this.roles.update((roles) =>
      roles.map((role) =>
        role.id === current.id
          ? {
              ...role,
              grants: {
                ...role.grants,
                [resourceId]: { ...role.grants[resourceId], [action]: value },
              },
            }
          : role,
      ),
    );
  }

  protected save(): void {
    this.messages.add({ severity: 'success', summary: this.lang.t('common.saveChanges') });
  }

  protected openCreate(): void {
    this.draftName.set('');
    this.draftModules.set({ ...PERMISSION_DRAFT_SEED });
    this.editorOpen.set(true);
  }

  protected saveRole(): void {
    const name = this.draftName().trim();
    if (!name) {
      return;
    }
    const id = `role-${Date.now()}`;
    this.roles.update((roles) => [
      ...roles,
      { id, name, grants: permissionGrantsFromModules(this.draftModules()) },
    ]);
    this.selectedId.set(id);
    this.editorOpen.set(false);
    this.messages.add({ severity: 'success', summary: this.lang.t('settings.addRole') });
  }

  protected async removeRole(): Promise<void> {
    if (this.roles().length < 2) {
      return;
    }
    const accepted = await this.confirm().ask({
      title: this.lang.t('settings.deleteRole'),
      message: this.lang.t('settings.deleteRoleMessage'),
      confirmLabel: this.lang.t('about.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    const removed = this.selectedId();
    this.roles.update((roles) => roles.filter((role) => role.id !== removed));
    this.selectedId.set(this.roles()[0].id);
    this.messages.add({ severity: 'success', summary: this.lang.t('settings.deleteRole') });
  }
}
