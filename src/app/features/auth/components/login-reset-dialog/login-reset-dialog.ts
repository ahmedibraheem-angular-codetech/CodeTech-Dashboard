import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';

export type LoginResetFormGroup = FormGroup<{
  email: FormControl<string>;
}>;

/**
 * Forgot-password dialog shell and body.
 * Keeps the existing `p-dialog` chrome (not `app-modal`) to preserve the current UI;
 * parent owns `requestPasswordReset` and sent-state updates.
 */
@Component({
  selector: 'app-login-reset-dialog',
  imports: [ReactiveFormsModule, Dialog, InputText, AppButton],
  templateUrl: './login-reset-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginResetDialog {
  readonly lang = inject(LanguageService);

  readonly visible = model.required<boolean>();
  readonly sent = input(false);
  readonly form = input.required<LoginResetFormGroup>();

  readonly send = output<void>();

  protected onSubmit(): void {
    this.send.emit();
  }
}
