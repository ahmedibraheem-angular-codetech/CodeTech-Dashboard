import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import {
  ApiError,
  isApiError,
  isOfflineFailure,
  loadFailureStatus,
  statusOf,
  toApiError,
} from './api-error';

describe('toApiError', () => {
  it('reads the localized message, dotted-path errors and Retry-After', () => {
    const error = toApiError(
      new HttpErrorResponse({
        status: 429,
        statusText: 'Too Many Requests',
        headers: new HttpHeaders({ 'Retry-After': '12' }),
        error: {
          message: 'انتظر قليلاً',
          errors: { email: ['too many'] },
        },
      }),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe('rate-limited');
    expect(error.serverMessage).toBe('انتظر قليلاً');
    expect(error.retryAfterSeconds).toBe(12);
    expect(error.fieldErrors['email']).toEqual(['too many']);
  });

  it('tolerates an HTML or empty body', () => {
    const error = toApiError(
      new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        error: '<html>oops</html>',
      }),
    );
    expect(error.serverMessage).toBeNull();
    expect(error.kind).toBe('server');
    expect(error.message).toBe('Request failed with status 500');
  });

  it('maps status 0 to a network error', () => {
    const error = toApiError(new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' }));
    expect(error.kind).toBe('network');
    expect(isApiError(error)).toBe(true);
    expect(statusOf(error)).toBe(0);
  });
});

describe('ApiError.kind matrix', () => {
  it.each([
    [0, 'network'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [409, 'conflict'],
    [422, 'validation'],
    [429, 'rate-limited'],
    [500, 'server'],
    [502, 'server'],
    [418, 'unknown'],
  ] as const)('maps status %i to %s', (status, kind) => {
    expect(new ApiError(status, null).kind).toBe(kind);
  });

  it('ignores non-array field error shapes and blank messages', () => {
    const error = toApiError(
      new HttpErrorResponse({
        status: 422,
        statusText: 'Unprocessable',
        headers: new HttpHeaders({ 'Retry-After': 'soon' }),
        error: {
          message: '   ',
          errors: { name: 'not-an-array', email: ['required'] },
        },
      }),
    );
    expect(error.serverMessage).toBeNull();
    expect(error.retryAfterSeconds).toBeNull();
    expect(error.fieldErrors).toEqual({ email: ['required'] });
    expect(error.kind).toBe('validation');
  });
});

describe('isOfflineFailure / loadFailureStatus', () => {
  it('treats browser offline and status-0 ApiError as offline', () => {
    expect(isOfflineFailure(new Error('x'), false)).toBe(true);
    expect(isOfflineFailure(new ApiError(0, null), true)).toBe(true);
    expect(loadFailureStatus(new ApiError(0, null), true)).toBe('offline');
  });

  it('does not treat HTTP server or auth failures as offline', () => {
    expect(isOfflineFailure(new ApiError(500, null), true)).toBe(false);
    expect(isOfflineFailure(new ApiError(401, null), true)).toBe(false);
    expect(isOfflineFailure(new ApiError(422, null, { name: ['required'] }), true)).toBe(false);
    expect(loadFailureStatus(new ApiError(500, null), true)).toBe('error');
  });
});
