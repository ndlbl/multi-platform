import { Navigate, useLocation } from 'react-router-dom';

import { getToken } from './token';
import { useCurrentUser } from './useCurrentUser';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const token = getToken();
  const userQuery = useCurrentUser();

  // No token not attempting auth.
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // has Token but not resolved /me yet
  if (userQuery.isLoading) {
    return <p className="p-6 text-slate-500">Checking session…</p>;
  }

  // 3. Token but /me gives in-valid, 401
  if (userQuery.isError || !userQuery.data) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
