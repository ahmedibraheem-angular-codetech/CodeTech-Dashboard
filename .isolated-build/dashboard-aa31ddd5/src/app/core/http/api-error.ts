import { HttpErrorResponse } from '@angular/common/http';

export type ApiErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'validation'
  | 'rate-limited'
  | 'server'
  | 'unknown';

export type FieldErrors = Readonly<Record<string, readonly string[]>>;

export class ApiError extends Error {
  constructor(
    readonly status: number,

    readonly serverMessage: string | null,
    readonly fieldErrors: FieldErrors = {},

    readonly retryAfterSeconds: number | null = null,
  ) {
    super(serverMessage ?? fallbackMessage(status));
    this.name = 'ApiError';
  }

  get kind(): ApiErrorKind {
    switch (this.status) {
      case 0:
        return 'network';
      case 401:
        return 'unauthorized';
      case 403:
        return 'forbidden';
      case 404:
        return 'not-found';
      case 409:
        return 'conflict';
      case 422:
        return 'validation';
      case 429:
        return 'rate-limited';
      default:
        return this.status >= 500 ? 'server' : 'unknown';
    }
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function statusOf(error: unknown): number | null {
  if (error instanceof ApiError || error instanceof HttpErrorResponse) {
    return error.status;
  }
  return null;
}

function fallbackMessage(status: number): string {
  return status === 0 ? 'Network error' : `Request failed with status ${status}`;
}

function readFieldErrors(value: unknown): FieldErrors {
  if (typeof value !== 'object' || value === null) {
    return {};
  }
  const result: Record<string, readonly string[]> = {};
  for (const [field, messages] of Object.entries(value)) {
    if (Array.isArray(messages) && messages.every((item) => typeof item === 'string')) {
      result[field] = messages;
    }
  }
  return result;
}

export function toApiError(error: HttpErrorResponse): ApiError {
  const body: unknown = error.error;
  const record = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const message =
    typeof record['message'] === 'string' && record['message'].trim() ? record['message'] : null;
  const retryAfter = Number.parseInt(error.headers?.get('Retry-After') ?? '', 10);
  return new ApiError(
    error.status,
    message,
    readFieldErrors(record['errors']),
    Number.isFinite(retryAfter) ? retryAfter : null,
  );
}
