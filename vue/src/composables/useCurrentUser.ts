import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/auth';

export function useCurrentUser() {
  const auth = useAuthStore();
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: computed(() => !!auth.token),
    staleTime: Infinity,
    retry: false,
    meta: { silent: true },
  });
}
