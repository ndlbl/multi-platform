import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { clearToken } from './auth/token';
import { useCurrentUser } from './auth/useCurrentUser';

export default function App() {
  const userQuery = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on any navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    clearToken();
    queryClient.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
          <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <img src="/icons/icon-96x96.png" alt="" aria-hidden="true" className="h-8 w-8" />
            <span className="sr-only sm:not-sr-only">Task Manager</span>
          </NavLink>

          {/* Desktop nav */}
          <nav aria-label="Main Navigation" className="hidden sm:block">
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

          {/* Hamburger button (mobile only) */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="sm:hidden rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
            aria-controls="mobile-menu"
          >
            {menuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Mobile Navigation"
            className="sm:hidden border-t border-slate-200"
          >
            <ul className="flex flex-col gap-1 px-4 py-3 text-sm text-slate-600">
              <li>
                <NavLink to="/" end className={mobileNavClass}>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/about" className={mobileNavClass}>
                  About
                </NavLink>
              </li>
              {hydrated && userQuery.data ? (
                <>
                  <li>
                    <NavLink to="/tasks" className={mobileNavClass}>
                      Tasks
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/library" className={mobileNavClass}>
                      Library
                    </NavLink>
                  </li>
                  {userQuery.data.role === 'admin' && (
                    <li>
                      <NavLink to="/admin" className={mobileNavClass}>
                        Admin
                      </NavLink>
                    </li>
                  )}
                  <li className="mt-2 border-t border-slate-100 pt-2">
                    <span className="block px-2 py-1 text-xs text-slate-400">
                      {userQuery.data.email}
                    </span>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="block w-full rounded-md px-2 py-2 text-left hover:bg-slate-50"
                    >
                      Log out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <NavLink to="/login" className={mobileNavClass}>
                      Log in
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/register" className={mobileNavClass}>
                      Register
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>
        )}
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

function mobileNavClass({ isActive }: { isActive: boolean }) {
  return `block rounded-md px-2 py-2 hover:bg-slate-50${isActive ? ' font-medium text-indigo-600' : ''}`;
}

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
