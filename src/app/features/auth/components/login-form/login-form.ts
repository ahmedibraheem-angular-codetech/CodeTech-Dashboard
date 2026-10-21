import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { FieldError } from '../../../../shared/components/field-error/field-error';

export type LoginFormGroup = FormGroup<{
  email: FormControl<string>;
  password: FormControl<string>;
}>;

/**
 * Login credentials form: email, password, remember-me, and forgot link.
 * Parent owns AuthService submit and the reset-dialog open state.
 */
@Component({
  selector: 'app-login-form',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    Button,
    AppButton,
    IconField,
    InputIcon,
    InputText,
    ToggleSwitch,
    FieldError,
  ],
  templateUrl: './login-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginForm {
  readonly lang = inject(LanguageService);

  readonly form = input.required<LoginFormGroup>();
  readonly submitting = input(false);
  readonly credentialError = input(false);
  readonly showPassword = model(false);
  /**
   * Cosmetic only for now: not sent to AuthService and nothing is persisted.
   * See Login page / README "Remember me".
   */
  readonly remember = model(false);

  readonly forgot = output<void>();
  readonly submitted = output<void>();

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
