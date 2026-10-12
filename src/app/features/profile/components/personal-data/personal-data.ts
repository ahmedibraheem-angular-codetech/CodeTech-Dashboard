import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';

import { ProfileDraft } from '../../../../core/profile/profile.model';
import { ProfileService } from '../../../../core/profile/profile.service';
import { LanguageService } from '../../../../core/services/language.service';
import { FieldError } from '../../../../shared/components/field-error/field-error';

type FieldName = keyof ProfileDraft;

interface FieldDef {
  name: FieldName;
  labelKey: string;
  icon: string;
  type: 'text' | 'email' | 'tel';
  autocomplete: string;
  /** Latin-script values (handles, emails, numbers) stay left-to-right even in Arabic. */
  ltr: boolean;
}

const FIELDS: readonly FieldDef[] = [
  {
    name: 'name',
    labelKey: 'profile.name',
    icon: 'pi pi-user',
    type: 'text',
    autocomplete: 'name',
    ltr: false,
  },
  {
    name: 'username',
    labelKey: 'profile.username',
    icon: 'pi pi-at',
    type: 'text',
    autocomplete: 'username',
    ltr: true,
  },
  {
    name: 'email',
    labelKey: 'profile.email',
    icon: 'pi pi-envelope',
    type: 'email',
    autocomplete: 'email',
    ltr: true,
  },
  {
    name: 'phone',
    labelKey: 'profile.phone',
    icon: 'pi pi-phone',
    type: 'tel',
    autocomplete: 'tel',
    ltr: true,
  },
];

/** Error code → translation key, per field. First matching error wins. */
const ERRORS: Record<FieldName, Record<string, string>> = {
  name: { required: 'profile.nameRequired' },
  username: { required: 'profile.usernameRequired', pattern: 'profile.usernameInvalid' },
  email: { required: 'auth.emailRequired', email: 'auth.emailInvalid' },
  phone: { required: 'profile.phoneRequired', pattern: 'profile.phoneInvalid' },
};

const USERNAME_PATTERN = /^@?[A-Za-z0-9_.]{3,30}$/;
const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;

@Component({
  selector: 'app-personal-data',
  imports: [ReactiveFormsModule, Button, IconField, InputIcon, InputText, FieldError],
  templateUrl: './personal-data.html',
  host: { class: 'd-block h-100' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalData {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ProfileService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);
  readonly fields = FIELDS;
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: [this.current().name, [Validators.required]],
    username: [
      this.current().username,
      [Validators.required, Validators.pattern(USERNAME_PATTERN)],
    ],
    email: [this.current().email, [Validators.required, Validators.email]],
    phone: [this.current().phone, [Validators.required, Validators.pattern(PHONE_PATTERN)]],
  });

  errorKey(name: FieldName): string | null {
    const control = this.form.controls[name];
    if (!control.touched || !control.errors) {
      return null;
    }
    const code = Object.keys(control.errors).find((key) => key in ERRORS[name]);
    return code ? ERRORS[name][code] : null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.api
      .update(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.markAsPristine();
          this.messages.add({ severity: 'success', summary: this.lang.t('profile.saved') });
        },
        error: () => {
          this.saving.set(false);
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  cancel(): void {
    this.form.reset(this.current());
  }

  private current(): ProfileDraft {
    const { name, username, email, phone } = this.api.profile() ?? {
      name: '',
      username: '',
      email: '',
      phone: '',
    };
    return { name, username, email, phone };
  }
}
