import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { type FormControl, type FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { FieldError } from '../../../../shared/components/field-error/field-error';

export type LoginForgotFormGroup = FormGroup<{
  email: FormControl<string>;
}>;

@Component({
  selector: 'app-login-forgot-form',
  imports: [ReactiveFormsModule, IconField, InputIcon, InputText, AppButton, FieldError],
  templateUrl: './login-forgot-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginForgotForm {
  readonly lang = inject(LanguageService);

  readonly form = input.required<LoginForgotFormGroup>();
  readonly submitting = input(false);

  readonly back = output<void>();
  readonly submitted = output<void>();

  protected emailShowError(): boolean {
    const control = this.form().controls.email;
    return control.invalid && (control.touched || control.dirty);
  }

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
