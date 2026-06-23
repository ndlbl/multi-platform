import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  const isPublic =
    !req.url.startsWith('/api') ||
    req.url.endsWith('/auth/login') ||
    req.url.endsWith('/auth/register');

  if (!token || isPublic) {
    return next(req);
  }

  const authedReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authedReq);
};
