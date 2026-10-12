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
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Dialog } from 'primeng/dialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';

import { LanguageService } from '../../../../core/services/language.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { FieldError } from '../../../../shared/components/field-error/field-error';
import { formatIsoDate, fromIsoDate, toIsoDate } from '../../../../shared/utils/date';
import { User, UserDraft, UserRole, UserStatus } from '../../models/user.model';
import { UsersService } from '../../services/users.service';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-users-page',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    Button,
    Dialog,
    IconField,
    InputIcon,
    InputText,
    Select,
    DatePicker,
    Tooltip,
    PageHeader,
    StateView,
    StatusBadge,
    ConfirmDialog,
    FieldError,
  ],
  templateUrl: './users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage {
  private readonly usersApi = inject(UsersService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);
  readonly q = input<string>();

  readonly state = signal<LoadState>('loading');
  readonly saving = signal(false);
  readonly rows = signal<User[]>([]);
  readonly query = signal('');
  readonly role = signal<UserRole | 'all'>('all');
  readonly status = signal<UserStatus | 'all'>('all');
  readonly from = signal<Date | null>(null);
  readonly editor = signal<'create' | 'edit' | 'view' | null>(null);
  readonly selected = signal<User | null>(null);

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
      { label: this.lang.t('users.all'), value: 'all' as const },
      { label: this.lang.t('roles.superAdmin'), value: 'super-admin' as const },
      { label: this.lang.t('roles.editor'), value: 'editor' as const },
      { label: this.lang.t('roles.viewer'), value: 'viewer' as const },
    ];
  });

  readonly statusOptions = computed(() => {
    this.lang.language();
    return [
      { label: this.lang.t('users.all'), value: 'all' as const },
      { label: this.lang.t('status.active'), value: 'active' as const },
      { label: this.lang.t('status.suspended'), value: 'suspended' as const },
    ];
  });

  readonly formRoles = computed(() =>
    this.roleOptions().filter((option) => option.value !== 'all'),
  );
  readonly formStatuses = computed(() =>
    this.statusOptions().filter((option) => option.value !== 'all'),
  );

  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    const role = this.role();
    const status = this.status();
    const from = this.from();
    return this.rows().filter((user) => {
      const matchesQuery = !query || `${user.name} ${user.email}`.toLowerCase().includes(query);
      const matchesRole = role === 'all' || user.role === role;
      const matchesStatus = status === 'all' || user.status === status;
      // Both sides are local midnight: `new Date('YYYY-MM-DD')` would parse as UTC and shift the day.
      const matchesDate = !from || fromIsoDate(user.joinedAt) >= this.startOfDay(from);
      return matchesQuery && matchesRole && matchesStatus && matchesDate;
    });
  });

  constructor() {
    effect(() => {
      const incoming = this.q();
      if (incoming) {
        this.query.set(incoming);
      }
    });
    this.load();
  }

  onSearch(event: Event): void {
    const target = event.target;
    this.query.set(target instanceof HTMLInputElement ? target.value : '');
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
    this.selected.set(user);
    this.form.reset(user);
    this.editor.set('edit');
  }

  openView(user: User): void {
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

  private notifyFailure(): void {
    this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
  }

  private startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }
}
