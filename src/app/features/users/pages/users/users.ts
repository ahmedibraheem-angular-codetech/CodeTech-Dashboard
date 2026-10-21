import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { type PaginatorState } from 'primeng/paginator';
import { Popover } from 'primeng/popover';
import { Select } from 'primeng/select';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { AppPaginator } from '../../../../shared/components/app-paginator/app-paginator';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import {
  DataTable,
  DataTableCellTemplate,
} from '../../../../shared/components/data-table/data-table';
import {
  DataTableBadgeValue,
  DataTableColumn,
  DataTableDateValue,
  DataTableIconValue,
} from '../../../../shared/components/data-table/data-table.model';
import { FieldError } from '../../../../shared/components/field-error/field-error';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { StatisticsCard } from '../../../../shared/components/statistics-cards/statistics-card.model';
import { StatisticsCards } from '../../../../shared/components/statistics-cards/statistics-cards';
import { formatIsoDate, toIsoDate } from '../../../../shared/utils/date';
import { User, UserDraft, UserRole, UserStatus } from '../../models/user.model';
import { UsersService } from '../../services/users.service';

type LoadState = 'loading' | 'ready' | 'error';

interface UserRow {
  id: string;
  code: string;
  name: DataTableIconValue;
  role: DataTableBadgeValue;
  email: string;
  status: DataTableBadgeValue;
  activity: DataTableDateValue;
  source: User;
}

@Component({
  selector: 'app-users-page',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    AppButton,
    Dialog,
    InputText,
    Select,
    Popover,
    PageHeader,
    StateView,
    StatusBadge,
    ConfirmDialog,
    FieldError,
    StatisticsCards,
    DataTable,
    DataTableCellTemplate,
    AppPaginator,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage {
  private readonly usersApi = inject(UsersService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly menu = viewChild.required(Popover);
  readonly lang = inject(LanguageService);
  readonly q = input<string>();

  readonly state = signal<LoadState>('loading');
  readonly saving = signal(false);
  readonly rows = signal<User[]>([]);
  readonly query = signal('');
  readonly role = signal<UserRole | 'all'>('all');
  readonly status = signal<UserStatus | 'all'>('all');
  readonly first = signal(0);
  readonly pageSize = signal(10);
  readonly editor = signal<'create' | 'edit' | 'view' | null>(null);
  readonly selected = signal<User | null>(null);
  readonly menuUser = signal<User | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{8,15}$/)]],
    role: this.fb.nonNullable.control<UserRole>('editor', Validators.required),
    status: this.fb.nonNullable.control<UserStatus>('active', Validators.required),
    joinedAt: ['', Validators.required],
  });

  readonly roleOptions = computed(() => {
    this.lang.language();
    return [
      { label: this.lang.t('users.allRoles'), value: 'all' as const },
      { label: this.lang.t('roles.superAdmin'), value: 'super-admin' as const },
      { label: this.lang.t('roles.editor'), value: 'editor' as const },
      { label: this.lang.t('roles.viewer'), value: 'viewer' as const },
    ];
  });

  readonly statusOptions = computed(() => {
    this.lang.language();
    return [
      { label: this.lang.t('users.allStatuses'), value: 'all' as const },
      { label: this.lang.t('status.active'), value: 'active' as const },
      { label: this.lang.t('users.statusInactive'), value: 'suspended' as const },
    ];
  });

  readonly formRoles = computed(() =>
    this.roleOptions().filter((option) => option.value !== 'all'),
  );
  readonly formStatuses = computed(() => [
    { label: this.lang.t('status.active'), value: 'active' as const },
    { label: this.lang.t('status.suspended'), value: 'suspended' as const },
  ]);

  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    const role = this.role();
    const status = this.status();
    return this.rows().filter((user) => {
      const matchesQuery =
        !query || `${user.name} ${user.email} ${user.id}`.toLowerCase().includes(query);
      const matchesRole = role === 'all' || user.role === role;
      const matchesStatus = status === 'all' || user.status === status;
      return matchesQuery && matchesRole && matchesStatus;
    });
  });

  readonly tableTitle = computed(
    () => `${this.lang.t('users.tableTitle')} (${this.filtered().length})`,
  );

  readonly cards = computed<StatisticsCard[]>(() => {
    this.lang.language();
    const caption = this.lang.t('users.statCaption');
    // Same demo KPI treatment as the inquiries board (visual parity with the reference).
    return [
      this.card(
        'total',
        this.lang.t('users.statTotal'),
        'pi pi-users',
        '#16a34a',
        '#dcfce7',
        caption,
      ),
      this.card(
        'active',
        this.lang.t('users.statActive'),
        'pi pi-user',
        '#2f6fed',
        '#dbeafe',
        caption,
      ),
      this.card(
        'inactive',
        this.lang.t('users.statInactive'),
        'pi pi-user-minus',
        '#ea580c',
        '#ffedd5',
        caption,
      ),
      this.card(
        'blocked',
        this.lang.t('users.statBlocked'),
        'pi pi-ban',
        '#e11d48',
        '#ffe4e6',
        caption,
      ),
    ];
  });

  readonly columns = computed<DataTableColumn<UserRow>[]>(() => {
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

  readonly tableRows = computed(() => {
    const all = this.filtered().map((user) => this.toRow(user));
    return all.slice(this.first(), this.first() + this.pageSize());
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
      this.first.set(0);
    });
    this.load();
  }

  protected page(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.pageSize.set(event.rows ?? this.pageSize());
  }

  load(): void {
    this.state.set('loading');
    this.usersApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.rows.set(users);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  formatDate(isoDate: string): string {
    return formatIsoDate(isoDate, this.lang.language());
  }

  roleLabel(role: UserRole): string {
    if (role === 'super-admin') {
      return this.lang.t('roles.superAdmin');
    }
    return this.lang.t(role === 'editor' ? 'roles.editor' : 'roles.viewer');
  }

  openCreate(): void {
    this.selected.set(null);
    this.form.reset({
      name: '',
      email: '',
      phone: '',
      role: 'editor',
      status: 'active',
      joinedAt: toIsoDate(new Date()),
    });
    this.editor.set('create');
  }

  openEdit(user: User): void {
    this.closeMenu();
    this.selected.set(user);
    this.form.reset(user);
    this.editor.set('edit');
  }

  openView(user: User): void {
    this.closeMenu();
    this.selected.set(user);
    this.editor.set('view');
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.saving()) {
      return;
    }
    const draft = this.form.getRawValue() satisfies UserDraft;
    const current = this.selected();
    const request = current ? this.usersApi.update(current.id, draft) : this.usersApi.create(draft);
    this.saving.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => {
        this.saving.set(false);
        this.rows.update((list) => {
          const exists = list.some((item) => item.id === user.id);
          return exists ? list.map((item) => (item.id === user.id ? user : item)) : [user, ...list];
        });
        this.editor.set(null);
        this.messages.add({
          severity: 'success',
          summary: this.lang.t(current ? 'users.updated' : 'users.created'),
        });
      },
      error: () => {
        this.saving.set(false);
        this.notifyFailure();
      },
    });
  }

  async remove(user: User): Promise<void> {
    this.closeMenu();
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
          this.rows.update((list) => list.filter((item) => item.id !== user.id));
          this.messages.add({ severity: 'success', summary: this.lang.t('users.deleted') });
        },
        error: () => this.notifyFailure(),
      });
  }

  protected exported(rows: readonly UserRow[]): void {
    this.messages.add({
      severity: 'success',
      summary: `${this.lang.t('users.export')} ${rows.length}`,
    });
  }

  protected openMenu(event: Event, user: User): void {
    event.stopPropagation();
    this.menuUser.set(user);
    this.menu().toggle(event);
  }

  protected closeMenu(): void {
    this.menuUser.set(null);
    this.menu().hide();
  }

  private toRow(user: User): UserRow {
    return {
      id: user.id,
      code: this.codeOf(user.id),
      name: { icon: 'pi pi-user', label: user.name },
      role: {
        label: this.roleLabel(user.role),
        tone: user.role === 'super-admin' ? 'closed' : user.role === 'editor' ? 'new' : 'progress',
      },
      email: this.shortEmail(user.email),
      status: {
        label:
          user.status === 'active'
            ? this.lang.t('status.active')
            : this.lang.t('users.statusInactive'),
        tone: user.status === 'active' ? 'new' : 'progress',
      },
      activity: {
        date: this.formatDate(user.joinedAt),
        time: this.lang.language() === 'ar' ? '12:00 م' : '12:00 PM',
      },
      source: user,
    };
  }

  private codeOf(id: string): string {
    const digits = id.replace(/\D/g, '') || '0';
    return `USE-${digits.padStart(5, '0')}`;
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
  ): StatisticsCard {
    return {
      id,
      title,
      value: '1,284',
      icon,
      iconColor,
      iconBackground,
      trend: 12.5,
      caption,
    };
  }

  private notifyFailure(): void {
    this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
  }
}
