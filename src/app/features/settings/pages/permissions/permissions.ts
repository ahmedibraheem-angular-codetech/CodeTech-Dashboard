import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';

export type PermissionAction = 'create' | 'update' | 'remove';

export interface PermissionResource {
  id: string;
  labelKey: string;
  groupKey?: string;
}

/** Modules shown as single toggles in the add-role dialog (Figma grid). */
export interface PermissionModule {
  id: string;
  labelKey: string;
  /** Matrix resource ids this module toggle drives. */
  resourceIds: readonly string[];
}

export interface PermissionRole {
  id: string;
  labelKey?: string;
  name?: string;
  grants: Record<string, Record<PermissionAction, boolean>>;
}

const RESOURCES: readonly PermissionResource[] = [
  { id: 'home', labelKey: 'nav.home' },
  { id: 'about', labelKey: 'nav.about' },
  { id: 'inquiries', labelKey: 'nav.inquiries', groupKey: 'nav.contact' },
  { id: 'start', labelKey: 'nav.startProjects', groupKey: 'nav.contact' },
  { id: 'products', labelKey: 'nav.products' },
  { id: 'projects', labelKey: 'nav.projects' },
  { id: 'knowledge', labelKey: 'nav.knowledge' },
  { id: 'reviews', labelKey: 'nav.reviews' },
  { id: 'settings', labelKey: 'nav.settings' },
  { id: 'support', labelKey: 'nav.support' },
  { id: 'seo', labelKey: 'nav.seo' },
];

/** 10-card create modal grid matching the reference (طلبات التواصل as one card). */
const MODULES: readonly PermissionModule[] = [
  { id: 'home', labelKey: 'nav.home', resourceIds: ['home'] },
  { id: 'about', labelKey: 'nav.about', resourceIds: ['about'] },
  { id: 'contact', labelKey: 'nav.contact', resourceIds: ['inquiries', 'start'] },
  { id: 'products', labelKey: 'nav.products', resourceIds: ['products'] },
  { id: 'projects', labelKey: 'nav.projects', resourceIds: ['projects'] },
  { id: 'knowledge', labelKey: 'nav.knowledge', resourceIds: ['knowledge'] },
  { id: 'reviews', labelKey: 'nav.reviews', resourceIds: ['reviews'] },
  { id: 'settings', labelKey: 'nav.settings', resourceIds: ['settings'] },
  { id: 'support', labelKey: 'nav.support', resourceIds: ['support'] },
  { id: 'seo', labelKey: 'nav.seo', resourceIds: ['seo'] },
];

const ACTIONS: readonly PermissionAction[] = ['create', 'update', 'remove'];

/** Seed matching the add-role reference toggles. */
const DRAFT_SEED: Readonly<Record<string, boolean>> = {
  home: true,
  about: true,
  contact: true,
  products: false,
  projects: false,
  knowledge: true,
  reviews: true,
  settings: false,
  support: true,
  seo: false,
};

function emptyGrants(): Record<string, Record<PermissionAction, boolean>> {
  return Object.fromEntries(
    RESOURCES.map((resource) => [resource.id, { create: false, update: false, remove: false }]),
  );
}

function grants(
  flags: Readonly<Record<string, readonly [boolean, boolean, boolean]>>,
): Record<string, Record<PermissionAction, boolean>> {
  const next = emptyGrants();
  for (const [id, [create, update, remove]] of Object.entries(flags)) {
    next[id] = { create, update, remove };
  }
  return next;
}

function grantsFromModules(
  modules: Readonly<Record<string, boolean>>,
): Record<string, Record<PermissionAction, boolean>> {
  const next = emptyGrants();
  for (const mod of MODULES) {
    const on = modules[mod.id] ?? false;
    for (const resourceId of mod.resourceIds) {
      next[resourceId] = { create: on, update: on, remove: on };
    }
  }
  return next;
}

@Component({
  selector: 'app-permissions-page',
  imports: [
    FormsModule,
    PageHeader,
    AppButton,
    Select,
    ToggleSwitch,
    ConfirmDialog,
    Modal,
    InputText,
  ],
  templateUrl: './permissions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsPage {
  private readonly messages = inject(MessageService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);

  readonly resources = RESOURCES;
  readonly modules = MODULES;
  readonly actions = ACTIONS;
  readonly roles = signal<PermissionRole[]>([
    {
      id: 'super-admin',
      labelKey: 'settings.roleSuperAdmin',
      grants: grants({
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
      grants: grants({
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
      grants: emptyGrants(),
    },
  ]);
  readonly selectedId = signal('super-admin');
  readonly editorOpen = signal(false);
  readonly draftName = signal('');
  readonly draftModules = signal<Record<string, boolean>>({ ...DRAFT_SEED });

  readonly selected = computed(
    () => this.roles().find((role) => role.id === this.selectedId()) ?? this.roles()[0],
  );
  readonly roleOptions = computed(() =>
    this.roles().map((role) => ({
      value: role.id,
      label: role.labelKey ? this.lang.t(role.labelKey) : (role.name ?? role.id),
    })),
  );

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
    return this.selected()?.grants[resourceId]?.[action] ?? false;
  }

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

  protected moduleOn(moduleId: string): boolean {
    return this.draftModules()[moduleId] ?? false;
  }

  protected setModule(moduleId: string, value: boolean): void {
    this.draftModules.update((current) => ({ ...current, [moduleId]: value }));
  }

  protected save(): void {
    this.messages.add({ severity: 'success', summary: this.lang.t('common.saveChanges') });
  }

  protected openCreate(): void {
    this.draftName.set('');
    this.draftModules.set({ ...DRAFT_SEED });
    this.editorOpen.set(true);
  }

  protected setDraftName(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.draftName.set(target.value);
    }
  }

  protected saveRole(): void {
    const name = this.draftName().trim();
    if (!name) {
      return;
    }
    const id = `role-${Date.now()}`;
    this.roles.update((roles) => [
      ...roles,
      { id, name, grants: grantsFromModules(this.draftModules()) },
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
