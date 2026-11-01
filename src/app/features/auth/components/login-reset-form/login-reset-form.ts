import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';
import { type FormControl, type FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputText } from 'primeng/inputtext';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { FieldError } from '../../../../shared/components/field-error/field-error';

export type LoginResetPasswordFormGroup = FormGroup<{
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}>;

@Component({
  selector: 'app-login-reset-form',
  imports: [ReactiveFormsModule, IconField, InputText, AppButton, FieldError],
  templateUrl: './login-reset-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginResetForm {
  readonly lang = inject(LanguageService);

  readonly form = input.required<LoginResetPasswordFormGroup>();
  readonly submitting = input(false);
  readonly showPassword = model(false);
  readonly showConfirm = model(false);

  readonly submitted = output<void>();

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
