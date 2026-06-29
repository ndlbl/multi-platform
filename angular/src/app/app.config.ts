import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { catchError, firstValueFrom, of } from 'rxjs';

import { routes } from './app.routes';
import { apiUrlInterceptor } from './core/api-url.interceptor';
import { authInterceptor } from './core/auth.interceptor';
import { AuthService } from './core/auth.service';
import { errorInterceptor } from './core/error.interceptor';
import { loadingInterceptor } from './core/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    // apiUrlInterceptor LAST: auth/error interceptors above key off the relative /api prefix.
    provideHttpClient(
      withInterceptors([authInterceptor, loadingInterceptor, errorInterceptor, apiUrlInterceptor]),
    ),

    // ← NEW: bootstrap current user before the router activates routes
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      if (!auth.token()) return Promise.resolve();
      return firstValueFrom(
        auth.loadCurrentUser().pipe(
          catchError(() => of(null)), // 401 → interceptor already cleared state
        ),
      );
    }),
    provideClientHydration(withEventReplay()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
