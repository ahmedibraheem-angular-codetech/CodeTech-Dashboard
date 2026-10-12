import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { InputOtp } from 'primeng/inputotp';

import { failureMessageKey, isAuthError } from '../../../../core/auth/auth.error';
import { AuthService } from '../../../../core/auth/auth.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AuthShell } from '../../../../layout/auth-layout/auth-shell';
import { FieldError } from '../../../../shared/components/field-error/field-error';

@Component({
  selector: 'app-verify',
  imports: [ReactiveFormsModule, AuthShell, InputOtp, FieldError],
  templateUrl: './verify.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Verify {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);
  readonly remaining = signal(0);
  readonly invalid = signal(false);
  readonly submitting = signal(false);
  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
  });
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  clock(): string {
    const total = this.remaining();
    const minutes = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (total % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  submit(): void {
    this.invalid.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.auth
      .verify(this.form.controls.code.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate(['/']),
        error: (error: unknown) => {
          this.submitting.set(false);
          if (isAuthError(error, 'invalid-otp')) {
            this.invalid.set(true);
            return;
          }
          this.notifyFailure(error);
          if (isAuthError(error, 'missing-pending')) {
            void this.router.navigate(['/login']);
          }
        },
      });
  }

  resend(): void {
    if (this.remaining() > 0) {
      return;
    }
    this.auth
      .resend()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.startTimer(60),
        error: (error: unknown) => this.notifyFailure(error),
      });
  }

  back(): void {
    void this.router.navigate(['/login']);
  }

  clearInvalid(): void {
    this.invalid.set(false);
  }

  private notifyFailure(error: unknown): void {
    this.messages.add({ severity: 'error', summary: this.lang.t(failureMessageKey(error)) });
  }

  private startTimer(seconds: number): void {
    this.clearTimer();
    this.remaining.set(seconds);
    this.timer = setInterval(() => {
      this.remaining.update((value) => {
        if (value <= 1) {
          this.clearTimer();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
