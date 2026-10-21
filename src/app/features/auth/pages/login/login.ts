import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { failureMessageKey, isAuthError } from '../../../../core/auth/auth.error';
import { AuthService } from '../../../../core/auth/auth.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AuthShell } from '../../../../layout/auth-layout/auth-shell';
import { LoginForm } from '../../components/login-form/login-form';
import { LoginResetDialog } from '../../components/login-reset-dialog/login-reset-dialog';

/**
 * Login page container: owns AuthService login/reset flows and composes
 * the credentials form plus forgot-password dialog.
 */
@Component({
  selector: 'app-login',
  imports: [AuthShell, LoginForm, LoginResetDialog],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);
  readonly submitting = signal(false);
  readonly credentialError = signal(false);
  readonly showPassword = signal(false);
  readonly resetOpen = signal(false);
  readonly resetSent = signal(false);
  /**
   * Cosmetic only for now: the value is not sent to `AuthService` and nothing is persisted.
   * Real "remember me" needs a server-issued long-lived session (e.g. an HttpOnly, Secure,
   * SameSite refresh cookie) once the API exists. Never store the password, and do not move
   * the token to `localStorage` to emulate it. See "Remember me" in the README.
   */
  readonly remember = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
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
    this.auth
      .login(email, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate(['/verify']),
        error: (error: unknown) => {
          this.submitting.set(false);
          if (isAuthError(error, 'invalid-password')) {
            this.credentialError.set(true);
            return;
          }
          this.messages.add({ severity: 'error', summary: this.lang.t(failureMessageKey(error)) });
        },
      });
  }

  sendReset(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.auth
      .requestPasswordReset(this.resetForm.controls.email.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.resetSent.set(true),
        error: (error: unknown) =>
          this.messages.add({ severity: 'error', summary: this.lang.t(failureMessageKey(error)) }),
      });
  }
}
