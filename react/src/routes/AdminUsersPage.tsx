import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { adminApi } from '../api/admin';

export default function AdminUsersPage() {
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.listUsers,
  });

  if (usersQuery.isPending) {
    return <p className="p-4 text-slate-500">Loading…</p>;
  }
  if (usersQuery.isError) {
    return (
      <div className="p-4 text-red-700">
        {usersQuery.error.message}
        <button className="ml-2 underline" onClick={() => usersQuery.refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const users = usersQuery.data;

  return (
    <section className="mx-auto max-w-4xl p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">All users</h2>
        <span className="text-sm text-slate-500">{users.length} total</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-right">Tasks</th>
              <th className="px-4 py-2 text-right">Library</th>
              <th className="px-4 py-2 text-left">Joined</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-900">{u.email}</td>
                <td className="px-4 py-3 text-sm">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-700">{u.taskCount}</td>
                <td className="px-4 py-3 text-right text-sm text-slate-700">{u.libraryCount}</td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/admin/users/${u.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RoleBadge({ role }: { role: 'user' | 'admin' }) {
  const styles = role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>{role}</span>;
}
