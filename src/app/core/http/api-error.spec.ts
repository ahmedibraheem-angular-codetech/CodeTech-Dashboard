import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { ApiError, isApiError, statusOf, toApiError } from './api-error';

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
