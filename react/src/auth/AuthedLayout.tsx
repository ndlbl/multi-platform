import { Outlet } from 'react-router';

import { RequireAuth } from './RequireAuth';

// Child routes behind RequireAuth (but not for admin roles)
export default function AuthedLayout() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}
