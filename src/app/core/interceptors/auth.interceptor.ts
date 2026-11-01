import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { API_BASE_URL, isApiUrl } from '../config/api';
import { isApiError } from '../http/api-error';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const base = inject(API_BASE_URL);
  if (!isApiUrl(request.url, base) || request.headers.has('Authorization')) {
    return next(request);
  }
  const auth = inject(AuthService);
  const token = auth.token();
  if (!token) {
    return next(request);
  }
  const router = inject(Router);

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      const status =
        error instanceof HttpErrorResponse ? error.status : isApiError(error) ? error.status : 0;
      if (status === 401 && auth.expireSession()) {
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
