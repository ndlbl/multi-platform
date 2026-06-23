import { Outlet } from 'react-router';

import { RequireAdmin } from './RequireAdmin';
import { RequireAuth } from './RequireAuth';

// stacked guards, for authed & admin.
export default function AdminLayout() {
  return (
    <RequireAuth>
      <RequireAdmin>
        <Outlet />
      </RequireAdmin>
    </RequireAuth>
  );
}
