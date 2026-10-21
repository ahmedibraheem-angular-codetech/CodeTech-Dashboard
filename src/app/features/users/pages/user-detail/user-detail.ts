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

import type { AppLanguage } from '../../../../core/i18n/language';
import { DEFAULT_AVATAR_URL } from '../../../../core/profile/profile.model';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { Modal } from '../../../../shared/components/modal/modal';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { UserDetailBan } from '../../components/user-detail-ban/user-detail-ban';
import { UserDetailFields } from '../../components/user-detail-fields/user-detail-fields';
import { UserDetailProfile } from '../../components/user-detail-profile/user-detail-profile';
import { UserEditorForm } from '../../components/user-editor-form/user-editor-form';
import { User, UserDraft, UserRole, UserStatus } from '../../models/user.model';
import { UsersService } from '../../services/users.service';

type LoadState = 'loading' | 'ready' | 'error' | 'missing';

/**
 * User detail container: loads the user, owns edit/status/delete workflows,
 * and composes profile, fields, and ban panels plus the shared editor modal.
 */
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
  private readonly fb = inject(FormBuilder);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly editorForm = viewChild.required(UserEditorForm);
  readonly lang = inject(LanguageService);

  /** Bound from `/users/:id`. */
  readonly id = input.required<string>();

  readonly status = signal<LoadState>('loading');
  readonly user = signal<User | null>(null);
  readonly saving = signal(false);
  readonly editing = signal(false);
  /** Locale for the edit modal only — does not change the page language. */
  readonly editorLocale = signal<AppLanguage>('ar');
  readonly avatarUrl = DEFAULT_AVATAR_URL;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{8,15}$/)]],
    role: this.fb.nonNullable.control<UserRole>('editor', Validators.required),
    status: this.fb.nonNullable.control<UserStatus>('active', Validators.required),
    joinedAt: ['', Validators.required],
  });

  /** Page-language status choices for the profile status menu (not the editor form). */
  readonly statusChoices = computed(() => {
    this.lang.language();
    return [
      { label: this.lang.t('status.active'), value: 'active' as const },
      { label: this.lang.t('status.suspended'), value: 'suspended' as const },
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

  readonly displayCode = computed(() => {
    const id = this.user()?.id ?? '';
    const digits = id.replace(/\D/g, '') || '0';
    return `USE-${digits.padStart(5, '0')}`;
  });

  readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    if (!role) {
      return '';
    }
    this.lang.language();
    if (role === 'super-admin') {
      return this.lang.t('roles.superAdmin');
    }
    return this.lang.t(role === 'editor' ? 'roles.editor' : 'roles.viewer');
  });

  readonly statusLabel = computed(() => {
    const current = this.user()?.status;
    if (!current) {
      return '';
    }
    this.lang.language();
    return current === 'active' ? this.lang.t('status.active') : this.lang.t('users.statusBlocked');
  });

  readonly timeLabel = computed(() => {
    this.lang.language();
    return `10:00 ${this.lang.t('users.timeAm')}`;
  });

  readonly stamp = computed(() => {
    const joined = this.user()?.joinedAt ?? '';
    const time = this.timeLabel();
    return joined ? `${time} - ${joined}` : '';
  });

  readonly isBlocked = computed(() => this.user()?.status === 'suspended');

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
  }

  protected reload(): void {
    this.load(this.id());
  }

  /** Copy for the edit modal only (follows `editorLocale`, not the page language). */
  editorT(key: string): string {
    return this.lang.lookup(key, this.editorLocale()) ?? key;
  }

  protected openEdit(): void {
    const current = this.user();
    if (!current) {
      return;
    }
    this.editorForm().clearPhoto();
    this.editorLocale.set(this.lang.language());
    this.form.reset(current);
    this.editing.set(true);
  }

  protected setEditingVisible(open: boolean): void {
    if (!open) {
      this.closeEditor();
    }
  }

  protected closeEditor(): void {
    this.editing.set(false);
    this.editorForm().clearPhoto();
  }

  protected setStatus(next: UserStatus): void {
    const current = this.user();
    if (!current || current.status === next || this.saving()) {
      return;
    }
    const draft: UserDraft = { ...current, status: next };
    this.persist(draft);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.saving()) {
      return;
    }
    const draft = this.form.getRawValue() satisfies UserDraft;
    this.persist(draft, () => this.closeEditor());
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

  private persist(draft: UserDraft, onSuccess?: () => void): void {
    const current = this.user();
    if (!current) {
      return;
    }
    this.saving.set(true);
    this.usersApi
      .update(current.id, draft)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.saving.set(false);
          onSuccess?.();
          this.messages.add({ severity: 'success', summary: this.lang.t('users.updated') });
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
        error: () => this.status.set('error'),
      });
  }

  private fail(): void {
    this.saving.set(false);
    this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
  }
}
