import { MutationCache, QueryCache, QueryClient } from '@tanstack/vue-query';
import { useToast } from './composables/useToast';
import { ApiError } from './api/client';

const { error: toastError } = useToast();

function handleUnauthenticated() {
  localStorage.removeItem('auth-token');
  queryClient.clear();
  if (typeof window !== 'undefined') window.location.assign('/login');
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },

  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.silent) return;
      if (error instanceof ApiError && error.status === 401) {
        handleUnauthenticated();
        return;
      }
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toastError(`Failed to load: ${message}`);
    },
  }),

  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silent) return;
      if (error instanceof ApiError && error.status === 401) {
        handleUnauthenticated();
        return;
      }
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toastError(message);
    },
  }),
});
