import { Link } from 'react-router-dom';

// Prerender/SSG target.
const features = [
  {
    title: 'Lorem ipsum',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
  },
  {
    title: 'Dolor sit amet',
    body: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.',
  },
  {
    title: 'Consectetur',
    body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla.',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="mx-auto max-w-4xl p-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mt-6">
          Organise your tasks and library reading lists, all in one place
        </h1>
        <p className="mx-auto mt-4 max-w-4xl text-lg text-slate-600">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/register"
            className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-700"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-4xl p-4">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing block */}
      <section className="mx-auto max-w-4xl p-4">
        <div className="rounded-xl bg-slate-900 py-12 text-center">
          <h2 className="text-2xl font-semibold text-white">Ready to get organised?</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-300">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore.
          </p>
          <Link
            to="/register"
            className="mt-6 inline-block rounded-md bg-white px-5 py-2.5 text-sm font-medium text-indigo-900 hover:text-indigo-700"
          >
            Create an account
          </Link>
        </div>
      </section>
    </div>
  );
}
