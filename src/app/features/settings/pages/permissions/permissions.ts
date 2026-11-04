import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { loadFailureStatus } from '../../../../core/http/api-error';
import { NetworkStatusService } from '../../../../core/services/network-status.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { PermissionsMatrix } from '../../components/permissions-matrix/permissions-matrix';
import { PermissionsRoleForm } from '../../components/permissions-role-form/permissions-role-form';
import type {
  PermissionCatalog,
  PermissionGrants,
  PermissionRole,
} from '../../models/permissions.model';
import {
  grantsFromPermissions,
  permissionsFromGrants,
  permissionsFromModuleToggles,
  preservedPermissions,
} from '../../models/permissions.model';
import { RolesService } from '../../services/roles.service';

type LoadState = 'loading' | 'ready' | 'error' | 'offline';

@Component({
  selector: 'app-permissions-page',
  imports: [
    PageHeader,
    AppButton,
    ConfirmDialog,
    Modal,
    StateView,
    PermissionsMatrix,
    PermissionsRoleForm,
    HasPermissionDirective,
  ],
  templateUrl: './permissions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsPage {
  private readonly rolesApi = inject(RolesService);
  private readonly messages = inject(MessageService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly network = inject(NetworkStatusService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);

  readonly state = signal<LoadState>('loading');
  readonly saving = signal(false);
  readonly catalog = signal<PermissionCatalog>({ modules: [], actions: [] });
  readonly roles = signal<PermissionRole[]>([]);
  readonly selectedId = signal('');
  readonly grants = signal<PermissionGrants>({});
  private readonly extras = signal<string[]>([]);
  readonly editorOpen = signal(false);
  readonly draftName = signal('');
  readonly draftModules = signal<Record<string, boolean>>({});

  readonly selected = computed(
    () => this.roles().find((role) => role.id === this.selectedId()) ?? null,
  );

  readonly roleOptions = computed(() =>
    this.roles().map((role) => ({ value: role.id, label: role.name })),
  );

  readonly canUpdate = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('roles.update');
  });
  readonly canDelete = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('roles.delete');
  });

  readonly locked = computed(() => this.selected()?.isProtected === true);

  constructor() {
    effect(() => {
      const id = this.selectedId();
      untracked(() => {
        if (id) {
          this.loadDetail(id);
        }
      });
    });
    effect(() => {
      this.lang.language();
      untracked(() => this.reloadCatalogLabels());
    });
    this.load();
  }

  load(): void {
    this.state.set('loading');
    forkJoin({
      catalog: this.rolesApi.catalog(),
      roles: this.rolesApi.list(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ catalog, roles }) => {
          this.catalog.set(catalog);
          this.roles.set(roles);
          this.state.set('ready');
          const current = this.selectedId();
          const preferred =
            roles.find((role) => role.id === current) ??
            roles.find((role) => !role.isProtected) ??
            roles[0];
          const next = preferred?.id ?? '';
          if (next !== current) {
            this.selectedId.set(next);
          } else if (next) {
            this.loadDetail(next);
          }
        },
        error: (error: unknown) => this.state.set(loadFailureStatus(error, this.network.online())),
      });
  }

  setGrant(moduleKey: string, action: string, value: boolean): void {
    const role = this.selected();
    if (!role || role.isProtected || !this.canUpdate()) {
      return;
    }
    const module = this.catalog().modules.find((item) => item.key === moduleKey);
    if (!module?.actions.includes(action)) {
      return;
    }
    this.grants.update((current) => ({
      ...current,
      [moduleKey]: { ...current[moduleKey], [action]: value },
    }));
  }

  save(): void {
    const role = this.selected();
    if (!role || role.isProtected || !this.canUpdate() || this.saving()) {
      return;
    }
    const permissions = permissionsFromGrants(this.catalog(), this.grants(), this.extras());
    this.saving.set(true);
    this.rolesApi
      .update(role.id, role.name, permissions)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.applyDetail(saved);
          this.roles.update((list) =>
            list.map((item) => (item.id === saved.id ? { ...item, ...saved } : item)),
          );
          this.messages.add({ severity: 'success', summary: this.lang.t('common.saveChanges') });
        },
        error: () => this.fail(),
      });
  }

  openCreate(): void {
    this.draftName.set('');
    this.draftModules.set({});
    this.editorOpen.set(true);
  }

  saveRole(): void {
    const name = this.draftName().trim();
    if (!name || this.saving()) {
      return;
    }
    const permissions = permissionsFromModuleToggles(this.catalog(), this.draftModules());
    this.saving.set(true);
    this.rolesApi
      .create(name, permissions)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.saving.set(false);
          this.editorOpen.set(false);
          this.roles.update((list) => [...list, created]);
          this.selectedId.set(created.id);
          this.applyDetail(created);
          this.messages.add({ severity: 'success', summary: this.lang.t('settings.addRole') });
        },
        error: () => this.fail(),
      });
  }

  async removeRole(): Promise<void> {
    const role = this.selected();
    if (!role || role.isProtected || !this.canDelete() || this.saving()) {
      return;
    }
    const accepted = await this.confirm().ask({
      title: this.lang.t('settings.deleteRole'),
      message: this.lang.t(
        role.usersCount > 0 ? 'settings.deleteRoleAssigned' : 'settings.deleteRoleMessage',
      ),
      confirmLabel: this.lang.t('about.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.saving.set(true);
    this.rolesApi
      .remove(role.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          const remaining = this.roles().filter((item) => item.id !== role.id);
          this.roles.set(remaining);
          this.selectedId.set(remaining[0]?.id ?? '');
          if (!remaining.length) {
            this.grants.set({});
            this.extras.set([]);
          }
          this.messages.add({ severity: 'success', summary: this.lang.t('settings.deleteRole') });
        },
        error: () => this.fail(),
      });
  }

  private detailRequest = 0;

  private loadDetail(id: string): void {
    const request = ++this.detailRequest;
    this.rolesApi
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (role) => {
          if (request !== this.detailRequest || !role || this.selectedId() !== id) {
            return;
          }
          this.applyDetail(role);
          this.roles.update((list) => list.map((item) => (item.id === role.id ? role : item)));
        },
        error: () => {
          if (request === this.detailRequest) {
            this.fail();
          }
        },
      });
  }

  private applyDetail(role: PermissionRole): void {
    const permissions = role.permissions ?? [];
    this.grants.set(grantsFromPermissions(this.catalog(), permissions));
    this.extras.set(preservedPermissions(this.catalog(), permissions));
  }

  private reloadCatalogLabels(): void {
    if (this.state() === 'loading') {
      return;
    }
    this.rolesApi
      .catalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalog) => {
          this.catalog.set(catalog);
          const role = this.selected();
          if (role?.permissions) {
            this.applyDetail(role);
          }
        },
        error: () => undefined,
      });
  }

  private fail(): void {
    this.saving.set(false);
    this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
  }
}
