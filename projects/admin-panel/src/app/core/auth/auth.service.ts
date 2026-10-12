import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API_LATENCY_MS } from '../config/latency';
import { AuthSession } from './auth.model';

const SESSION_KEY = 'codetech.session';
const PENDING_KEY = 'codetech.pending';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly latency = inject(API_LATENCY_MS);
  readonly session = signal<AuthSession | null>(this.readSession());
  readonly pendingEmail = signal<string | null>(this.readPending());
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly token = computed(() => this.session()?.token ?? null);

  login(email: string, password: string): Observable<void> {
    return timer(this.latency).pipe(
      map(() => {
        if (password !== environment.demoPassword) {
          throw new Error('invalid-password');
        }
        const normalized = email.trim();
        this.pendingEmail.set(normalized);
        this.writePending(normalized);
      }),
    );
  }

  verify(code: string): Observable<void> {
    return timer(this.latency).pipe(
      map(() => {
        const email = this.pendingEmail();
        if (!email) {
          throw new Error('missing-pending');
        }
        if (code !== environment.demoOtp) {
          throw new Error('invalid-otp');
        }
        const session: AuthSession = {
          token: crypto.randomUUID(),
          email,
          name: 'أحمد محمد',
          roleKey: 'roles.superAdmin',
        };
        this.session.set(session);
        this.pendingEmail.set(null);
        this.writeSession(session);
        this.writePending(null);
      }),
    );
  }

  resend(): Observable<void> {
    return timer(this.latency).pipe(map(() => undefined));
  }

  requestPasswordReset(email: string): Observable<string> {
    return timer(this.latency).pipe(map(() => email.trim()));
  }

  logout(): void {
    this.session.set(null);
    this.pendingEmail.set(null);
    this.writeSession(null);
    this.writePending(null);
  }

  hasPendingLogin(): boolean {
    return this.pendingEmail() !== null;
  }

  private readSession(): AuthSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        return null;
      }
      const parsed: unknown = JSON.parse(raw);
      if (!this.isSession(parsed)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private readPending(): string | null {
    try {
      return sessionStorage.getItem(PENDING_KEY);
    } catch {
      return null;
    }
  }

  private writeSession(session: AuthSession | null): void {
    try {
      if (!session) {
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Ignore private-mode storage failures.
    }
  }

  private writePending(email: string | null): void {
    try {
      if (!email) {
        sessionStorage.removeItem(PENDING_KEY);
        return;
      }
      sessionStorage.setItem(PENDING_KEY, email);
    } catch {
      // Ignore private-mode storage failures.
    }
  }

  private isSession(value: unknown): value is AuthSession {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const record = value as Record<string, unknown>;
    return (
      typeof record['token'] === 'string' &&
      typeof record['email'] === 'string' &&
      typeof record['name'] === 'string' &&
      typeof record['roleKey'] === 'string'
    );
  }
}
