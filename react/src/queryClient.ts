import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { ApiError } from './api/client';
import { clearToken } from './auth/token';

// On 401, reset auth and bounce to login. not a hook as it lives outside of react
function handleUnauthenticated() {
  clearToken();
  queryClient.clear();
  if (typeof window !== 'undefined') window.location.assign('/login');
}

export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },

  queryCache: new QueryCache({
    onError: (error, query) => {
      // `silent` ops fully own their error UX (e.g. the login form shows its own
      // banner), so bail before the global 401 redirect — otherwise their 401
      // bounces the whole page to /login and the inline error is lost.
      if (query.meta?.silent) return;
      if (error instanceof ApiError && error.status === 401) {
        handleUnauthenticated();
        return;
      }
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(`Failed to load: ${message}`);
    },
  }),

  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // See queryCache note: silent mutations (e.g. login) render their own error
      // and must not be hijacked by the global 401 redirect/reload.
      if (mutation.meta?.silent) return;
      if (error instanceof ApiError && error.status === 401) {
        handleUnauthenticated();
        return;
      }
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
    },
  }),
});
