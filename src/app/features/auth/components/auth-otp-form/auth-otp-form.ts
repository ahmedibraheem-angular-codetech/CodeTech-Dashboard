import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { type FormControl, type FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputOtp } from 'primeng/inputotp';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { FieldError } from '../../../../shared/components/field-error/field-error';

export type AuthOtpFormGroup = FormGroup<{
  code: FormControl<string>;
}>;

@Component({
  selector: 'app-auth-otp-form',
  imports: [ReactiveFormsModule, Button, AppButton, InputOtp, FieldError],
  templateUrl: './auth-otp-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthOtpForm {
  readonly lang = inject(LanguageService);

  readonly form = input.required<AuthOtpFormGroup>();
  readonly invalid = input(false);
  readonly submitting = input(false);
  readonly remaining = input(0);
  readonly clock = input.required<string>();
  readonly titleKey = input('auth.verifyTitle');
  readonly submitKey = input('auth.verifySubmit');

  readonly back = output<void>();
  readonly submitted = output<void>();
  readonly resend = output<void>();
  readonly cleared = output<void>();

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
