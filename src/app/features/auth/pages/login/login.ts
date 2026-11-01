import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  type AbstractControl,
  FormBuilder,
  type ValidationErrors,
  type ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { failureMessageKey, isAuthError } from '../../../../core/auth/auth.error';
import { AuthService } from '../../../../core/auth/auth.service';
import { DEMO_CREDENTIALS } from '../../../../core/config/demo-credentials';
import { LanguageService } from '../../../../core/services/language.service';
import { AuthShell } from '../../../../layout/auth-layout/auth-shell';
import { AuthOtpForm } from '../../components/auth-otp-form/auth-otp-form';
import { LoginForgotForm } from '../../components/login-forgot-form/login-forgot-form';
import { LoginForm } from '../../components/login-form/login-form';
import { LoginResetForm } from '../../components/login-reset-form/login-reset-form';
import { LoginResetSuccess } from '../../components/login-reset-success/login-reset-success';

export type LoginView = 'login' | 'forgot' | 'forgot-otp' | 'forgot-reset';

function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    if (!password || !confirm || password === confirm) {
      return null;
    }
    return { mismatch: true };
  };
}

@Component({
  selector: 'app-login',
  imports: [AuthShell, LoginForm, LoginForgotForm, AuthOtpForm, LoginResetForm, LoginResetSuccess],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly demo = inject(DEMO_CREDENTIALS);
  readonly lang = inject(LanguageService);

  readonly view = signal<LoginView>('login');
  readonly submitting = signal(false);
  readonly credentialError = signal(false);
  readonly showPassword = signal(false);
  readonly showResetPassword = signal(false);
  readonly showResetConfirm = signal(false);
  readonly resetSubmitting = signal(false);
  readonly otpSubmitting = signal(false);
  readonly otpInvalid = signal(false);
  readonly otpRemaining = signal(0);
  readonly successOpen = signal(false);

  readonly remember = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly resetForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly otpForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
  });

  readonly newPasswordForm = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator() },
  );

  private otpTimer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearOtpTimer());
  }

  otpClock(): string {
    const total = this.otpRemaining();
    const minutes = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (total % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  openForgot(): void {
    this.resetForm.reset({ email: this.form.controls.email.value });
    this.view.set('forgot');
  }

  backToLogin(): void {
    this.clearOtpTimer();
    this.otpInvalid.set(false);
    this.otpForm.reset({ code: '' });
    this.newPasswordForm.reset({ password: '', confirmPassword: '' });
    this.successOpen.set(false);
    this.view.set('login');
  }

  backToForgot(): void {
    this.clearOtpTimer();
    this.otpInvalid.set(false);
    this.otpForm.reset({ code: '' });
    this.view.set('forgot');
  }

  submit(): void {
    this.credentialError.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth
      .login(email, password, this.remember())
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
    this.resetSubmitting.set(true);
    this.auth
      .requestPasswordReset(this.resetForm.controls.email.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resetSubmitting.set(false);
          this.otpForm.reset({ code: '' });
          this.otpInvalid.set(false);
          this.view.set('forgot-otp');
          this.startOtpTimer(60);
        },
        error: (error: unknown) => {
          this.resetSubmitting.set(false);
          this.messages.add({ severity: 'error', summary: this.lang.t(failureMessageKey(error)) });
        },
      });
  }

  submitOtp(): void {
    this.otpInvalid.set(false);
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }
    this.otpSubmitting.set(true);
    const code = this.otpForm.controls.code.value;
    const expected = this.demo?.otp;

    queueMicrotask(() => {
      this.otpSubmitting.set(false);
      if (!expected || code !== expected) {
        this.otpInvalid.set(true);
        return;
      }
      this.newPasswordForm.reset({ password: '', confirmPassword: '' });
      this.view.set('forgot-reset');
    });
  }

  resendOtp(): void {
    if (this.otpRemaining() > 0) {
      return;
    }
    this.auth
      .requestPasswordReset(this.resetForm.controls.email.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.startOtpTimer(60),
        error: (error: unknown) =>
          this.messages.add({ severity: 'error', summary: this.lang.t(failureMessageKey(error)) }),
      });
  }

  clearOtpInvalid(): void {
    this.otpInvalid.set(false);
  }

  submitNewPassword(): void {
    if (this.newPasswordForm.invalid) {
      this.newPasswordForm.markAllAsTouched();
      return;
    }
    this.resetSubmitting.set(true);

    queueMicrotask(() => {
      this.resetSubmitting.set(false);
      this.successOpen.set(true);
    });
  }

  finishResetSuccess(): void {
    this.successOpen.set(false);
    this.backToLogin();
  }

  private startOtpTimer(seconds: number): void {
    this.clearOtpTimer();
    this.otpRemaining.set(seconds);
    this.otpTimer = setInterval(() => {
      this.otpRemaining.update((value) => {
        if (value <= 1) {
          this.clearOtpTimer();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  }

  private clearOtpTimer(): void {
    if (this.otpTimer) {
      clearInterval(this.otpTimer);
      this.otpTimer = undefined;
    }
    this.otpRemaining.set(0);
  }
}
