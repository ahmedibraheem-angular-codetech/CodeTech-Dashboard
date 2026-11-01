import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  type AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { distinctUntilChanged, finalize, map } from 'rxjs';

import { type ProfileDraft } from '../../../../core/profile/profile.model';
import { ProfileService } from '../../../../core/profile/profile.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { FieldError } from '../../../../shared/components/field-error/field-error';

type FieldName = keyof ProfileDraft;

interface FieldDef {

  name: FieldName;

  labelKey: string;

  icon: string;
  type: 'text' | 'email' | 'tel';

  autocomplete: string;

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

const ERRORS: Record<FieldName, Record<string, string>> = {
  name: { required: 'profile.nameRequired', whitespace: 'profile.nameRequired' },
  username: {
    required: 'profile.usernameRequired',
    whitespace: 'profile.usernameRequired',
    pattern: 'profile.usernameInvalid',
  },
  email: {
    required: 'auth.emailRequired',
    whitespace: 'auth.emailRequired',
    email: 'auth.emailInvalid',
  },
  phone: {
    required: 'profile.phoneRequired',
    whitespace: 'profile.phoneRequired',
    pattern: 'profile.phoneInvalid',
  },
};

const USERNAME_PATTERN = /^@?[A-Za-z0-9_.]{3,30}$/;

const PHONE_PATTERN = /^\+?(?:\d[\s-]?){6,19}\d$/;

export function noWhitespaceOnly(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return typeof value === 'string' && value.length > 0 && value.trim().length === 0
    ? { whitespace: true }
    : null;
}

function sameDraft(a: ProfileDraft, b: ProfileDraft): boolean {
  return (
    a.name === b.name && a.username === b.username && a.email === b.email && a.phone === b.phone
  );
}

function normalize(draft: ProfileDraft): ProfileDraft {
  const username = draft.username.trim().replace(/^@+/, '');
  return {
    name: draft.name.trim(),
    username: username ? `@${username}` : '',
    email: draft.email.trim(),
    phone: draft.phone.trim(),
  };
}

@Component({
  selector: 'app-personal-data',
  imports: [ReactiveFormsModule, AppButton, IconField, InputIcon, InputText, FieldError],
  templateUrl: './personal-data.html',
  host: { class: 'd-block h-100' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalData {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ProfileService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly lang = inject(LanguageService);
  protected readonly fields = FIELDS;

  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: [this.current().name, [Validators.required, noWhitespaceOnly]],
    username: [
      this.current().username,
      [Validators.required, noWhitespaceOnly, Validators.pattern(USERNAME_PATTERN)],
    ],
    email: [this.current().email, [Validators.required, noWhitespaceOnly, Validators.email]],
    phone: [
      this.current().phone,
      [Validators.required, noWhitespaceOnly, Validators.pattern(PHONE_PATTERN)],
    ],
  });

  protected readonly pristine = toSignal(
    this.form.events.pipe(
      map(() => this.form.pristine),
      distinctUntilChanged(),
    ),
    { initialValue: true },
  );

  private readonly draft = computed(() => this.current(), { equal: sameDraft });

  constructor() {

    effect(() => {
      const draft = this.draft();
      untracked(() => {
        if (this.form.pristine) {
          this.form.reset(draft);
        }
      });
    });
  }

  errorKey(name: FieldName): string | null {
    const control = this.form.controls[name];
    if (!control.touched || !control.errors) {
      return null;
    }
    const code = Object.keys(control.errors).find((key) => key in ERRORS[name]);
    return code ? ERRORS[name][code] : null;
  }

  save(): void {
    if (this.saving()) {
      return;
    }

    this.form.setValue(normalize(this.form.getRawValue()));
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.api
      .update(this.form.getRawValue())
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.form.markAsPristine();
          this.messages.add({ severity: 'success', summary: this.lang.t('profile.saved') });
        },
        error: () => this.messages.add({ severity: 'error', summary: this.lang.t('common.error') }),
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
