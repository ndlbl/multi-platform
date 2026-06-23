import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../environments/environment';

/**
 * Rewrites relative `/api/*` requests to the deployed API origin.
 * Empty in dev → no rewrite, the Angular dev proxy handles `/api`.
 *
 * Should run after the auth/error interceptor.
 */
export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (environment.apiUrl && req.url.startsWith('/api')) {
    return next(req.clone({ url: environment.apiUrl + req.url }));
  }
  return next(req);
};
