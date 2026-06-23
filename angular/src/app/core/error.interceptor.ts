import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/api/auth/');

      // 401, stale token; logout + redirect
      if (err.status === 401 && !isAuthEndpoint) {
        auth.logout();
        router.navigate(['/login']);
        return throwError(() => err);
      }

      // Auth endpoints display own errors — don't override with toasts
      if (isAuthEndpoint) {
        return throwError(() => err);
      }

      const message = humanise(err, req.url);
      toast.error(message);
      return throwError(() => err);
    }),
  );
};

function humanise(err: HttpErrorResponse, url: string): string {
  if (err.status === 0) return `Network error — could not reach ${url}`;
  if (typeof err.error?.error === 'string') return err.error.error;
  return `${err.status} ${err.statusText || 'Error'}`;
}
