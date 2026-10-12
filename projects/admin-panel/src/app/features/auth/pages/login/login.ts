import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Dialog } from 'primeng/dialog';

import { AuthService } from '../../../../core/auth/auth.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AuthShell } from '../../../../layout/auth-layout/auth-shell';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, Dialog, AuthShell],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly lang = inject(LanguageService);
  readonly submitting = signal(false);
  readonly credentialError = signal(false);
  readonly showPassword = signal(false);
  readonly resetOpen = signal(false);
  readonly resetSent = signal(false);
  readonly remember = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['Amaalkamal621@Gmail.Com', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly resetForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    this.credentialError.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => void this.router.navigate(['/verify']),
      error: () => {
        this.credentialError.set(true);
        this.submitting.set(false);
      },
    });
  }

  onRemember(event: Event): void {
    const target = event.target;
    this.remember.set(target instanceof HTMLInputElement && target.checked);
  }

  sendReset(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.auth.requestPasswordReset(this.resetForm.controls.email.value).subscribe(() => {
      this.resetSent.set(true);
    });
  }
}
