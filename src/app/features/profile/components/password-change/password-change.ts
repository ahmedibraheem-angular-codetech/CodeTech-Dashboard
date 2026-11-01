import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  type AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { IconField } from 'primeng/iconfield';
import { InputText } from 'primeng/inputtext';

import { ProfileService } from '../../../../core/profile/profile.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { FieldError } from '../../../../shared/components/field-error/field-error';

type FieldName = 'current' | 'next' | 'confirm';

interface FieldDef {
  name: FieldName;
  labelKey: string;
  placeholderKey: string | null;
  autocomplete: 'current-password' | 'new-password';
}

const FIELDS: readonly FieldDef[] = [
  {
    name: 'current',
    labelKey: 'profile.currentPassword',
    placeholderKey: null,
    autocomplete: 'current-password',
  },
  {
    name: 'next',
    labelKey: 'profile.newPassword',
    placeholderKey: 'profile.newPasswordPlaceholder',
    autocomplete: 'new-password',
  },
  {
    name: 'confirm',
    labelKey: 'profile.confirmPassword',
    placeholderKey: 'profile.confirmPasswordPlaceholder',
    autocomplete: 'new-password',
  },
];

export const MIN_PASSWORD_LENGTH = 8;

const REQUIRED_KEYS: Record<FieldName, string> = {
  current: 'profile.currentRequired',
  next: 'profile.newRequired',
  confirm: 'profile.confirmRequired',
};

export function passwordRules(group: AbstractControl): ValidationErrors | null {
  const { current, next, confirm } = group.value as Record<FieldName, string>;
  const errors: ValidationErrors = {};
  if (next && current && next === current) {
    errors['same'] = true;
  }
  if (confirm && next !== confirm) {
    errors['mismatch'] = true;
  }
  return Object.keys(errors).length ? errors : null;
}

@Component({
  selector: 'app-password-change',
  imports: [ReactiveFormsModule, AppButton, IconField, InputText, FieldError],
  templateUrl: './password-change.html',
  host: { class: 'd-block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordChange {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ProfileService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);
  readonly fields = FIELDS;
  readonly saving = signal(false);
  private readonly visible = signal<ReadonlySet<FieldName>>(new Set());

  readonly form = this.fb.nonNullable.group(
    {
      current: ['', [Validators.required]],
      next: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
      confirm: ['', [Validators.required]],
    },
    { validators: [passwordRules] },
  );

  isVisible(name: FieldName): boolean {
    return this.visible().has(name);
  }

  toggle(name: FieldName): void {
    this.visible.update((current) => {
      const next = new Set(current);
      if (!next.delete(name)) {
        next.add(name);
      }
      return next;
    });
  }

  errorKey(name: FieldName): string | null {
    const control = this.form.controls[name];
    if (!control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return REQUIRED_KEYS[name];
    }
    if (name === 'next' && control.hasError('minlength')) {
      return 'profile.newShort';
    }
    if (name === 'next' && this.form.hasError('same')) {
      return 'profile.newSame';
    }
    if (name === 'confirm' && this.form.hasError('mismatch')) {
      return 'profile.confirmMismatch';
    }
    return null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const { current, next } = this.form.getRawValue();
    this.api
      .changePassword(current, next)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.reset();
          this.visible.set(new Set());
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('profile.passwordChanged'),
          });
        },
        error: () => {
          this.saving.set(false);
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  cancel(): void {
    this.form.reset();
    this.visible.set(new Set());
  }
}
