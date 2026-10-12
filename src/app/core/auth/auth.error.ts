export type AuthErrorCode = 'invalid-password' | 'invalid-otp' | 'missing-pending' | 'unavailable';

/** Typed authentication failure. `message` equals `code` so it stays easy to assert on. */
export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code);
    this.name = 'AuthError';
  }
}

export function isAuthError(error: unknown, code?: AuthErrorCode): error is AuthError {
  return error instanceof AuthError && (code === undefined || error.code === code);
}

/** Translation key for a failure that is not a plain "wrong credentials" case. */
export function failureMessageKey(error: unknown): string {
  return isAuthError(error, 'unavailable') ? 'auth.unavailable' : 'common.error';
}
