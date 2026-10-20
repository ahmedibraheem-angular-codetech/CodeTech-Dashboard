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
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { distinctUntilChanged, finalize, map } from 'rxjs';

import { ProfileDraft } from '../../../../core/profile/profile.model';
import { ProfileService } from '../../../../core/profile/profile.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { FieldError } from '../../../../shared/components/field-error/field-error';

/** The editable profile fields; each one is a form control with the same name. */
type FieldName = keyof ProfileDraft;

/** Describes one input of the form, so the template can render all four with a single `@for`. */
interface FieldDef {
  /** Form control name; also used to build the input and error element ids. */
  name: FieldName;
  /** Translation key of the label. */
  labelKey: string;
  /** PrimeIcons classes for the icon shown inside the input. */
  icon: string;
  type: 'text' | 'email' | 'tel';
  /** Value for the native `autocomplete` attribute. */
  autocomplete: string;
  /** Latin-script values (handles, emails, numbers) stay left-to-right even in Arabic. */
  ltr: boolean;
}

/** Fields in display order. */
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

/** Optional leading `@`, then 3 to 30 letters, digits, `_` or `.`. */
const USERNAME_PATTERN = /^@?[A-Za-z0-9_.]{3,30}$/;
/** Optional leading `+`, then 7 to 20 digits, each optionally followed by one space or dash. */
const PHONE_PATTERN = /^\+?(?:\d[\s-]?){6,19}\d$/;

/** Rejects values made only of spaces, which `Validators.required` lets through. */
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

/** Trims every value and keeps exactly one leading `@` on the username, as it is stored. */
function normalize(draft: ProfileDraft): ProfileDraft {
  const username = draft.username.trim().replace(/^@+/, '');
  return {
    name: draft.name.trim(),
    username: username ? `@${username}` : '',
    email: draft.email.trim(),
    phone: draft.phone.trim(),
  };
}

/**
 * Personal data card of the profile page: a reactive form prefilled from `ProfileService`.
 * Save sends the values to the service and confirms with a toast; Cancel restores the last
 * saved values. Validation errors only show once a field has been touched. If the profile
 * arrives after the form is built, the form is refilled as long as the user has not edited it.
 */
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
  /** True while the save request is in flight; disables the submit button via `loading`. */
  readonly saving = signal(false);

  /** Initial values come from the current profile; the validators mirror the error map above. */
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

  /**
   * `form.pristine` as a signal for the template. Driven by `form.events` because
   * `statusChanges` stays silent when `markAsPristine()` runs after a save.
   */
  protected readonly pristine = toSignal(
    this.form.events.pipe(
      map(() => this.form.pristine),
      distinctUntilChanged(),
    ),
    { initialValue: true },
  );

  /** The editable slice of the profile; only emits when one of the four values changes. */
  private readonly draft = computed(() => this.current(), { equal: sameDraft });

  constructor() {
    // Refills the form when the profile loads or changes, but never over the user's edits.
    effect(() => {
      const draft = this.draft();
      untracked(() => {
        if (this.form.pristine) {
          this.form.reset(draft);
        }
      });
    });
  }

  /** Translation key of the first error to show for a field, or `null` when there is none. */
  errorKey(name: FieldName): string | null {
    const control = this.form.controls[name];
    if (!control.touched || !control.errors) {
      return null;
    }
    const code = Object.keys(control.errors).find((key) => key in ERRORS[name]);
    return code ? ERRORS[name][code] : null;
  }

  /** Normalizes, validates, then saves. An invalid form is only marked as touched to show errors. */
  save(): void {
    if (this.saving()) {
      return;
    }
    // Trim before validating so stray spaces around a pasted value do not fail the patterns.
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

  /** Discards unsaved edits and resets the form to the profile as currently stored. */
  cancel(): void {
    this.form.reset(this.current());
  }

  /** The editable slice of the profile, with empty strings while signed out. */
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
