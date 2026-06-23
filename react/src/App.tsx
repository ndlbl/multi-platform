import { useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { clearToken } from './auth/token';
import { useCurrentUser } from './auth/useCurrentUser';

export default function App() {
  const userQuery = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // avoid hydration mismatch, then uses real auth values
  const hydrated = useHydrated();

  const handleLogout = () => {
    clearToken();
    queryClient.clear(); // wipe cached data  (user switch?)
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
          <NavLink to="/" className="text-xl font-bold text-slate-900">
            Task Manager
          </NavLink>

          <nav aria-label="Main Navigation">
            <ul className="flex items-center gap-4 text-sm text-slate-600">
              <li>
                <NavLink to="/" end className={navClass}>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/about" className={navClass}>
                  About
                </NavLink>
              </li>

              {hydrated && userQuery.data ? (
                <>
                  <li>
                    <NavLink to="/tasks" className={navClass}>
                      Tasks
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/library" className={navClass}>
                      Library
                    </NavLink>
                  </li>

                  {userQuery.data.role === 'admin' && (
                    <li>
                      <NavLink to="/admin" className={navClass}>
                        Admin
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <span className="text-slate-500">{userQuery.data.email}</span>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="text-slate-600 hover:text-slate-900">
                      Log out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <NavLink to="/login" className={navClass}>
                      Log in
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/register" className={navClass}>
                      Register
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'font-medium text-indigo-600' : 'hover:text-slate-900';
}

// hydration check
const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // client
    () => false, // server
  );
}
