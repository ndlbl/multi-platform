import { useQuery } from '@tanstack/react-query';

import { authApi, type User } from '../api/auth';
import { getToken } from './token';

export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: !!getToken(), // skip if no token — avoids guaranteed 401
    staleTime: Infinity, // IDs don't go stale
    retry: false, // if a 401, don't retry
    meta: { silent: true }, // don't toast alert it, handle auth UI separately
  });
}
