import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { adminApi } from '../api/admin';
import type { LibraryItem } from '../library/types';

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Three queries fire in parallel, TanStack Query dedupes and handles it concurrently.
  const userQuery = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => adminApi.getUser(id!),
    enabled: !!id,
  });

  const tasksQuery = useQuery({
    queryKey: ['admin', 'users', id, 'tasks'],
    queryFn: () => adminApi.getUserTasks(id!),
    enabled: !!id,
  });

  const libraryQuery = useQuery({
    queryKey: ['admin', 'users', id, 'library'],
    queryFn: () => adminApi.getUserLibrary(id!),
    enabled: !!id,
  });

  if (userQuery.isPending || tasksQuery.isPending || libraryQuery.isPending) {
    return <p className="p-4 text-slate-500">Loading…</p>;
  }
  if (userQuery.isError) {
    return <p className="p-4 text-red-700">{userQuery.error.message}</p>;
  }

  const user = userQuery.data;
  const tasks = tasksQuery.data ?? [];
  const library = libraryQuery.data ?? [];

  return (
    <section className="mx-auto max-w-4xlp-4">
      {/* Header */}
      <div>
        <Link to="/admin" className="text-sm text-slate-600 hover:text-slate-900">
          ← All users
        </Link>
        <div className="mt-2 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">{user.email}</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {user.role}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Joined {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Tasks */}
      <section>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">
          Tasks <span className="text-slate-400">({tasks.length})</span>
        </h3>
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
            No tasks.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-3 p-3 text-sm">
                <DoneBadge done={task.done} />
                <span className={task.done ? 'text-slate-400 line-through' : 'text-slate-900'}>
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Library */}
      <section>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">
          Library <span className="text-slate-400">({library.length})</span>
        </h3>
        {library.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
            No library items.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {library.map((item) => (
              <LibraryRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

function DoneBadge({ done }: { done: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 items-center justify-center rounded border text-xs ${
        done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
      }`}
    >
      {done && '✓'}
    </span>
  );
}

function LibraryRow({ item }: { item: LibraryItem }) {
  return (
    <li className="flex items-start gap-3 p-3 text-sm">
      <div className="mt-0.5">
        <DoneBadge done={item.consumed} />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={item.consumed ? 'text-slate-400 line-through' : 'text-slate-900'}>
            {item.title}
          </span>
          <span className="text-xs uppercase text-slate-400">{item.kind}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          <LibraryDetail item={item} />
        </p>
      </div>
    </li>
  );
}

function LibraryDetail({ item }: { item: LibraryItem }) {
  switch (item.kind) {
    case 'book':
      return (
        <>
          {item.author} · {item.pages} pages
        </>
      );
    case 'podcast':
      return (
        <>
          {item.host} · {item.durationMinutes} min
        </>
      );
    case 'article':
      return (
        <a href={item.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
          {item.source}
        </a>
      );
  }
}
