import './index.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { Links, Meta, Scripts, ScrollRestoration } from 'react-router';

import App from './App';
import GlobalSpinner from './components/GlobalSpinner';
import { queryClient } from './queryClient';

// doc shell — we render this instead of index.html.
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <title>Task Manager</title>
        <Meta />
        <Links />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <GlobalSpinner />
          {children}
          <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// what wraps the <Outlet/>.
export default function Root() {
  return <App />;
}

// pre-hydration loader, shows fallback till app loads.
export function HydrateFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div
        role="status"
        aria-label="Loading"
        className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"
      />
    </div>
  );
}
