import { isApiError } from '../http/api-error';

export type AuthErrorCode = 'invalid-password' | 'invalid-otp' | 'missing-pending' | 'unavailable';

export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code);
    this.name = 'AuthError';
  }
}

export function isAuthError(error: unknown, code?: AuthErrorCode): error is AuthError {
  return error instanceof AuthError && (code === undefined || error.code === code);
}

export function failureMessageKey(error: unknown): string {
  if (isApiError(error) && error.serverMessage) {
    return error.serverMessage;
  }
  return isAuthError(error, 'unavailable') ? 'auth.unavailable' : 'common.error';
}
