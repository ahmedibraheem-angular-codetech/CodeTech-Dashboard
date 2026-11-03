import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../../core/auth/auth.service';
import { loadFailureStatus } from '../../../../core/http/api-error';
import { NetworkStatusService } from '../../../../core/services/network-status.service';
import type { AppLanguage } from '../../../../core/i18n/language';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { Modal } from '../../../../shared/components/modal/modal';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { UserDetailBan } from '../../components/user-detail-ban/user-detail-ban';
import { UserDetailFields } from '../../components/user-detail-fields/user-detail-fields';
import { UserDetailProfile } from '../../components/user-detail-profile/user-detail-profile';
import { UserEditorForm } from '../../components/user-editor-form/user-editor-form';
import {
  type AssignableRole,
  type User,
  type UserDraft,
  type UserStatus,
} from '../../models/user.model';
import { UsersService } from '../../services/users.service';
import {
  formatUserStamp,
  isAssignableRoleId,
  isUserStatus,
  userStatusLabelKey,
} from '../../services/user.mapper';

type LoadState = 'loading' | 'ready' | 'error' | 'offline' | 'missing';

const PHONE_PATTERN = /^$|^\+?[0-9][0-9 -]{6,19}$/;

@Component({
  selector: 'app-user-detail',
  imports: [
    ConfirmDialog,
    Modal,
    StateView,
    UserDetailProfile,
    UserDetailFields,
    UserDetailBan,
    UserEditorForm,
  ],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailPage {
  private readonly usersApi = inject(UsersService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly breadcrumbs = inject(BreadcrumbService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly network = inject(NetworkStatusService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly editorForm = viewChild.required(UserEditorForm);
  readonly lang = inject(LanguageService);

  readonly id = input.required<string>();

  readonly status = signal<LoadState>('loading');
  readonly user = signal<User | null>(null);
  readonly roles = signal<AssignableRole[]>([]);
  readonly saving = signal(false);
  readonly editing = signal(false);

  readonly editorLocale = signal<AppLanguage>('ar');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.pattern(PHONE_PATTERN)],
    roleId: this.fb.control<number | null>(null, Validators.required),
    status: this.fb.control<UserStatus | null>('active', Validators.required),
  });

  readonly editorRoles = computed(() =>
    this.roles().map((role) => ({ label: role.name, value: role.id })),
  );

  readonly statusChoices = computed(() => {
    this.lang.language();
    return [
      { label: this.lang.t('status.active'), value: 'active' as const },
      { label: this.lang.t('users.statusInactive'), value: 'inactive' as const },
      { label: this.lang.t('users.statusBlocked'), value: 'blocked' as const },
    ];
  });

  readonly editorTitle = computed(() => {
    this.editorLocale();
    return this.editorT('users.editTitle');
  });

  readonly editorSaveLabel = computed(() => {
    this.editorLocale();
    return this.editorT('common.saveChanges');
  });

  readonly canUpdate = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('users.update');
  });
  readonly canDelete = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('users.delete');
  });

  readonly displayCode = computed(() => this.user()?.code ?? '');

  readonly roleLabel = computed(() => {
    this.lang.language();
    return this.user()?.role?.name || this.lang.t('users.noRole');
  });

  readonly statusLabel = computed(() => {
    const current = this.user();
    if (!current) {
      return '';
    }
    this.lang.language();
    const key = userStatusLabelKey(current.status);
    return key ? this.lang.t(key) : current.statusRaw;
  });

  readonly activityLabel = computed(() => {
    this.lang.language();
    return this.joinStamp(this.user()?.lastActivityAt ?? null);
  });

  readonly joinedLabel = computed(() => {
    this.lang.language();
    return this.joinStamp(this.user()?.createdAt ?? null);
  });

  readonly banLabel = computed(() => {
    this.lang.language();
    return this.joinStamp(this.user()?.blockedAt ?? null);
  });

  readonly headerTime = computed(() => {
    this.lang.language();
    return formatUserStamp(this.user()?.lastActivityAt ?? this.user()?.createdAt ?? null, this.lang.language())
      .time;
  });

  readonly headerDate = computed(() => {
    this.lang.language();
    return formatUserStamp(this.user()?.createdAt ?? null, this.lang.language()).date;
  });

  readonly isBlocked = computed(() => this.user()?.status === 'blocked');

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
    effect(() => {
      const current = this.user();
      const url = `/users/${this.id()}`;
      if (current) {
        this.breadcrumbs.setLabel(url, current.name);
      }
    });
    this.destroyRef.onDestroy(() => {
      this.breadcrumbs.clearLabel(`/users/${this.id()}`);
    });
    this.usersApi
      .roles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (roles) => this.roles.set(roles),
        error: () => this.roles.set([]),
      });
  }

  protected reload(): void {
    this.load(this.id());
  }

  editorT(key: string): string {
    return this.lang.lookup(key, this.editorLocale()) ?? key;
  }

  protected openEdit(): void {
    const current = this.user();
    if (!current) {
      return;
    }
    this.editorLocale.set(this.lang.language());
    const roleId =
      current.role && isAssignableRoleId(current.role.id, this.roles()) ? current.role.id : null;
    this.form.reset({
      name: current.name,
      email: current.email,
      phone: current.phone,
      roleId,
      status: current.status,
    });
    this.editorForm().prepare(
      current.avatarUrl ? { url: current.avatarUrl, name: current.name } : null,
    );
    this.editing.set(true);
  }

  protected setEditingVisible(open: boolean): void {
    if (!open) {
      this.closeEditor();
    }
  }

  protected closeEditor(): void {
    this.editing.set(false);
    this.editorForm().prepare(null);
  }

  protected setStatus(next: UserStatus): void {
    const current = this.user();
    if (!current || current.status === next || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.usersApi
      .setStatus(current.id, next)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.saving.set(false);
          this.messages.add({ severity: 'success', summary: this.lang.t('users.updated') });
        },
        error: () => this.fail(),
      });
  }

  protected save(): void {
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
    const current = this.user();
    if (!current) {
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
    this.saving.set(true);
    this.usersApi
      .update(current.id, draft, this.roles())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.saving.set(false);
          this.closeEditor();
          this.messages.add({ severity: 'success', summary: this.lang.t('users.updated') });
        },
        error: () => this.fail(),
      });
  }

  protected async remove(): Promise<void> {
    const current = this.user();
    if (!current) {
      return;
    }
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
    this.saving.set(true);
    this.usersApi
      .remove(current.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.messages.add({ severity: 'success', summary: this.lang.t('users.deleted') });
          void this.router.navigate(['/users']);
        },
        error: () => this.fail(),
      });
  }

  private load(id: string): void {
    this.status.set('loading');
    this.usersApi
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.status.set(user ? 'ready' : 'missing');
        },
        error: (error: unknown) => this.status.set(loadFailureStatus(error, this.network.online())),
      });
  }

  private joinStamp(iso: string | null): string {
    const stamp = formatUserStamp(iso, this.lang.language());
    return [stamp.time, stamp.date].filter(Boolean).join(' · ');
  }

  private fail(): void {
    this.saving.set(false);
    this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
  }
}
