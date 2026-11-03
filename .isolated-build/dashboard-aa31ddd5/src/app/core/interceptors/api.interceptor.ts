import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { API_BASE_URL, isApiUrl } from '../config/api';
import { toApiError } from '../http/api-error';
import { LanguageService } from '../services/language.service';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const base = inject(API_BASE_URL);
  if (!isApiUrl(request.url, base)) {
    return next(request);
  }
  const lang = inject(LanguageService);
  const headers: Record<string, string> = { 'Accept-Language': lang.language() };
  if (request.responseType === 'json') {
    headers['Accept'] = 'application/json';
  }
  return next(request.clone({ setHeaders: headers })).pipe(
    catchError((error: unknown) =>
      throwError(() => (error instanceof HttpErrorResponse ? toApiError(error) : error)),
    ),
  );
};
