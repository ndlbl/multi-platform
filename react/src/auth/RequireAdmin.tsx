import { Navigate } from 'react-router-dom';

import { useCurrentUser } from './useCurrentUser';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const userQuery = useCurrentUser();

  if (userQuery.isLoading) {
    return <p className="p-6 text-slate-500">Checking session…</p>;
  }

  if (userQuery.data?.role !== 'admin') {
    // Non admin roles to bounce to tasks. Not 403 & we don't show them the admin nav.
    return <Navigate to="/tasks" replace />;
  }

  return <>{children}</>;
}
