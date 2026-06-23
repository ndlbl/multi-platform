import { RenderMode, ServerRoute } from '@angular/ssr';

// Non authed routes to pre-render, data driven routes to be CSR.

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },

  { path: '**', renderMode: RenderMode.Client },
];
