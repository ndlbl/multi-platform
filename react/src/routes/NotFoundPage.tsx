import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-4xl p-4 text-center">
      <h2 className="text-2xl font-semibold text-slate-900">404</h2>
      <p className="mt-2 text-slate-500">
        That route doesn't exist.{' '}
        <Link to="/tasks" className="text-indigo-600 underline">
          Back to tasks
        </Link>
        .
      </p>
    </section>
  );
}
