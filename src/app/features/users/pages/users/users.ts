import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, debounceTime, EMPTY, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { loadFailureStatus } from '../../../../core/http/api-error';
import { NetworkStatusService } from '../../../../core/services/network-status.service';
import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import type {
  DataTableBadgeTone,
  DataTableColumn,
} from '../../../../shared/components/data-table/data-table.model';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { type StatisticsCard } from '../../../../shared/components/statistics-cards/statistics-card.model';
import { StatisticsCards } from '../../../../shared/components/statistics-cards/statistics-cards';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { UserEditorForm } from '../../components/user-editor-form/user-editor-form';
import { UsersTable, type UsersTableRow } from '../../components/users-table/users-table';
import {
  type AssignableRole,
  type User,
  type UserDraft,
  type UserStats,
  type UserStatsMetric,
  type UserStatus,
} from '../../models/user.model';
import { UsersService } from '../../services/users.service';
import {
  formatUserStamp,
  isAssignableRoleId,
  isUserStatus,
  userStatusLabelKey,
} from '../../services/user.mapper';

type LoadState = 'loading' | 'ready' | 'error' | 'offline';

const PHONE_PATTERN = /^$|^\+?[0-9][0-9 -]{6,19}$/;

@Component({
  selector: 'app-users-page',
  imports: [
    AppButton,
    PageHeader,
    StateView,
    ConfirmDialog,
    Modal,
    StatisticsCards,
    UsersTable,
    UserEditorForm,
    HasPermissionDirective,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage {
  private readonly usersApi = inject(UsersService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly network = inject(NetworkStatusService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly editorForm = viewChild.required(UserEditorForm);
  readonly lang = inject(LanguageService);
  readonly q = input<string>();

  readonly state = signal<LoadState>('loading');
  readonly saving = signal(false);
  readonly exporting = signal(false);
  readonly rows = signal<User[]>([]);
  readonly total = signal(0);
  readonly roles = signal<AssignableRole[]>([]);
  readonly stats = signal<UserStats | null>(null);
  readonly query = signal('');
  readonly role = signal('all');
  readonly status = signal<UserStatus | 'all'>('all');
  readonly first = signal(0);
  readonly pageSize = signal(10);
  readonly editor = signal<'create' | 'edit' | null>(null);
  readonly selected = signal<User | null>(null);
  private readonly reloadTick = signal(0);

  readonly editorLocale = signal<AppLanguage>('ar');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.pattern(PHONE_PATTERN)],
    roleId: this.fb.control<number | null>(null, Validators.required),
    status: this.fb.control<UserStatus | null>('active', Validators.required),
  });

  readonly roleOptions = computed(() => {
    this.lang.language();
    return [
      { label: this.lang.t('users.allRoles'), value: 'all' },
      ...this.roles().map((role) => ({ label: role.name, value: String(role.id) })),
    ];
  });

  readonly editorRoles = computed(() =>
    this.roles().map((role) => ({ label: role.name, value: role.id })),
  );

  readonly statusOptions = computed(() => {
    this.lang.language();
    return [
      { label: this.lang.t('users.allStatuses'), value: 'all' as const },
      { label: this.lang.t('status.active'), value: 'active' as const },
      { label: this.lang.t('users.statusInactive'), value: 'inactive' as const },
      { label: this.lang.t('users.statusBlocked'), value: 'blocked' as const },
    ];
  });

  readonly editorTitle = computed(() => {
    this.editorLocale();
    return this.editorT(this.editor() === 'create' ? 'users.createTitle' : 'users.editTitle');
  });

  readonly editorSaveLabel = computed(() => {
    this.editorLocale();
    return this.editorT(this.editor() === 'create' ? 'users.addSubmit' : 'common.saveChanges');
  });

  readonly canUpdate = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('users.update');
  });
  readonly canDelete = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('users.delete');
  });

  readonly tableTitle = computed(() => `${this.lang.t('users.tableTitle')} (${this.total()})`);

  readonly cards = computed<StatisticsCard[]>(() => {
    this.lang.language();
    const caption = this.lang.t('users.statCaption');
    const stats = this.stats();
    return [
      this.card(
        'total',
        this.lang.t('users.statTotal'),
        'pi pi-users',
        '#16a34a',
        '#dcfce7',
        caption,
        stats?.total,
      ),
      this.card(
        'active',
        this.lang.t('users.statActive'),
        'pi pi-user',
        '#2f6fed',
        '#dbeafe',
        caption,
        stats?.active,
      ),
      this.card(
        'inactive',
        this.lang.t('users.statInactive'),
        'pi pi-user-minus',
        '#ea580c',
        '#ffedd5',
        caption,
        stats?.inactive,
      ),
      this.card(
        'blocked',
        this.lang.t('users.statBlocked'),
        'pi pi-ban',
        '#e11d48',
        '#ffe4e6',
        caption,
        stats?.blocked,
      ),
    ];
  });

  readonly columns = computed<DataTableColumn<UsersTableRow>[]>(() => {
    this.lang.language();
    return [
      { key: 'code', header: 'ID', field: 'code', width: '120px' },
      { key: 'name', header: this.lang.t('users.name'), field: 'name', kind: 'icon-text' },
      {
        key: 'role',
        header: this.lang.t('users.role'),
        field: 'role',
        kind: 'badge',
        width: '150px',
      },
      {
        key: 'email',
        header: this.lang.t('users.emailCol'),
        field: 'email',
        dir: 'ltr',
        width: '200px',
      },
      {
        key: 'status',
        header: this.lang.t('users.status'),
        field: 'status',
        kind: 'badge',
        width: '130px',
      },
      {
        key: 'activity',
        header: this.lang.t('users.lastActivity'),
        field: 'activity',
        kind: 'datetime',
        width: '220px',
      },
      { key: 'actions', header: '', width: '64px' },
    ];
  });

  readonly tableRows = computed(() => this.rows().map((user) => this.toRow(user)));

  private readonly listQuery = computed(() => {
    this.reloadTick();
    const status = this.status();
    const role = this.role();
    const roleId = role === 'all' ? undefined : Number(role);
    return {
      page: Math.floor(this.first() / this.pageSize()) + 1,
      perPage: this.pageSize(),
      search: this.query().trim(),
      status: status === 'all' ? undefined : status,
      roleId: roleId != null && Number.isInteger(roleId) && roleId > 0 ? roleId : undefined,
    };
  });

  constructor() {
    effect(() => {
      const incoming = this.q();
      if (incoming) {
        this.query.set(incoming);
      }
    });
    effect(() => {
      this.query();
      this.role();
      this.status();
      untracked(() => {
        if (this.first() !== 0) {
          this.first.set(0);
        }
      });
    });

    this.loadStats();
    this.loadRoles();

    toObservable(this.listQuery)
      .pipe(
        debounceTime(200),
        switchMap((query) =>
          this.usersApi.list(query).pipe(
            catchError((error: unknown) => {
              this.failLoad(error);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((page) => {
        this.rows.set(page.items);
        this.total.set(page.total);
        this.state.set('ready');
      });
  }

  load(): void {
    this.state.set('loading');
    this.reloadTick.update((value) => value + 1);
    this.loadStats();
    this.loadRoles();
  }

  editorT(key: string): string {
    return this.lang.lookup(key, this.editorLocale()) ?? key;
  }

  openCreate(): void {
    this.selected.set(null);
    this.editorForm().prepare(null);
    this.editorLocale.set(this.lang.language());
    this.form.reset({
      name: '',
      email: '',
      phone: '',
      roleId: null,
      status: 'active',
    });
    this.editor.set('create');
  }

  openEdit(user: User): void {
    this.editorLocale.set(this.lang.language());
    this.selected.set(user);
    const roleId =
      user.role && isAssignableRoleId(user.role.id, this.roles()) ? user.role.id : null;
    this.form.reset({
      name: user.name,
      email: user.email,
      phone: user.phone,
      roleId,
      status: user.status,
    });
    this.editorForm().prepare(user.avatarUrl ? { url: user.avatarUrl, name: user.name } : null);
    this.editor.set('edit');
  }

  openView(user: User): void {
    void this.router.navigate(['/users', user.id]);
  }

  protected openDetail(row: UsersTableRow): void {
    void this.router.navigate(['/users', row.source.id]);
  }

  protected setEditorVisible(open: boolean): void {
    if (!open) {
      this.closeEditor();
    }
  }

  protected closeEditor(): void {
    this.editor.set(null);
    this.editorForm().prepare(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.saving()) {
      return;
    }
    const raw = this.form.getRawValue();
    const roleId = raw.roleId;
    if (roleId == null || !isAssignableRoleId(roleId, this.roles())) {
      this.form.controls.roleId.setErrors({ role: true });
      this.form.controls.roleId.markAsTouched();
      return;
    }
    if (!raw.status || !isUserStatus(raw.status)) {
      this.form.controls.status.setErrors({ status: true });
      this.form.controls.status.markAsTouched();
      return;
    }
    const draft: UserDraft = {
      name: raw.name.trim(),
      email: raw.email.trim(),
      phone: raw.phone.trim(),
      roleId,
      status: raw.status,
      avatar: this.editorForm().avatarPayload(),
    };
    const current = this.selected();
    const request = current
      ? this.usersApi.update(current.id, draft, this.roles())
      : this.usersApi.create(draft, this.roles());
    this.saving.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeEditor();
        this.messages.add({
          severity: 'success',
          summary: this.lang.t(current ? 'users.updated' : 'users.created'),
        });
        this.refresh();
      },
      error: () => {
        this.saving.set(false);
        this.notifyFailure();
      },
    });
  }

  async remove(user: User): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('users.deleteTitle'),
      message: this.lang.t('users.deleteMessage'),
      confirmLabel: this.lang.t('users.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.usersApi
      .remove(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: this.lang.t('users.deleted') });
          this.refresh();
        },
        error: () => this.notifyFailure(),
      });
  }

  protected exported(): void {
    if (this.exporting()) {
      return;
    }
    const query = this.listQuery();
    this.exporting.set(true);
    this.usersApi
      .exportCsv({ search: query.search, status: query.status, roleId: query.roleId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.exporting.set(false);
          const href = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = href;
          link.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
          link.click();
          URL.revokeObjectURL(href);
          this.messages.add({ severity: 'success', summary: this.lang.t('users.export') });
        },
        error: () => {
          this.exporting.set(false);
          this.notifyFailure();
        },
      });
  }

  private refresh(): void {
    this.reloadTick.update((value) => value + 1);
    this.loadStats();
  }

  private loadStats(): void {
    this.usersApi
      .stats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: () => this.stats.set(null),
      });
  }

  private loadRoles(): void {
    this.usersApi
      .roles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (roles) => this.roles.set(roles),
        error: () => this.roles.set([]),
      });
  }

  private failLoad(error?: unknown): void {
    if (this.state() === 'loading') {
      this.state.set(loadFailureStatus(error, this.network.online()));
      return;
    }
    this.notifyFailure();
  }

  private toRow(user: User): UsersTableRow {
    const activity = formatUserStamp(user.lastActivityAt, this.lang.language());
    const labelKey = userStatusLabelKey(user.status);
    return {
      id: user.id,
      code: user.code,
      name: { icon: 'pi pi-user', label: user.name },
      role: {
        label: user.role?.name || this.lang.t('users.noRole'),
        tone: user.role?.isProtected ? 'closed' : user.role ? 'new' : 'neutral',
      },
      email: this.shortEmail(user.email),
      status: {
        label: labelKey ? this.lang.t(labelKey) : user.statusRaw,
        tone: this.statusTone(user.status),
      },
      activity: { date: activity.date, time: activity.time },
      source: user,
    };
  }

  private statusTone(status: UserStatus | null): DataTableBadgeTone {
    if (status === 'active') {
      return 'new';
    }
    if (status === 'inactive') {
      return 'progress';
    }
    if (status === 'blocked') {
      return 'closed';
    }
    return 'neutral';
  }

  private shortEmail(email: string): string {
    if (email.length <= 18) {
      return email;
    }
    const at = email.indexOf('@');
    if (at <= 0) {
      return `${email.slice(0, 15)}...`;
    }
    return `${email.slice(0, Math.min(8, at))}...${email.slice(at)}`;
  }

  private card(
    id: string,
    title: string,
    icon: string,
    iconColor: string,
    iconBackground: string,
    caption: string,
    metric?: UserStatsMetric,
  ): StatisticsCard {
    const value = metric?.value ?? 0;
    const trend = metric?.changePct;
    return {
      id,
      title,
      value: value.toLocaleString(this.lang.language() === 'ar' ? 'ar' : 'en'),
      icon,
      iconColor,
      iconBackground,
      caption,
      ...(trend == null
        ? {}
        : {
            trend,
            trendDirection: trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral',
          }),
    };
  }

  private notifyFailure(): void {
    this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
  }
}
