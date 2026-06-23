import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { type Task, tasksApi } from '../api/tasks';

export default function TaskListPage() {
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.list,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks'] });

  const toggleMutation = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      tasksApi.update(id, { done: !done }),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: invalidate,
  });

  if (tasksQuery.isPending) {
    return <TaskListSkeleton />;
  }

  if (tasksQuery.isError) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {tasksQuery.error.message}
        <button className="ml-2 underline" onClick={() => tasksQuery.refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const tasks = tasksQuery.data;
  const outstanding = tasks?.filter((t) => !t.done).length;

  return (
    <section className="mx-auto max-w-4xl p-4">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Your tasks</h2>
        <div className="flex items-baseline gap-4">
          <span className="text-sm text-slate-500">{outstanding} outstanding</span>
          <Link
            to="/tasks/new"
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white shadow hover:bg-indigo-700"
          >
            + New task
          </Link>
        </div>
      </div>
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
        {tasks.length === 0 ? (
          <li className="p-4 text-center text-slate-500">No tasks yet.</li>
        ) : (
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggleMutation.mutate({ id: task.id, done: task.done })}
              onRemove={() => removeMutation.mutate(task.id)}
            />
          ))
        )}
      </ul>
    </section>
  );
}

function TaskListSkeleton() {
  return (
    <section className="mx-auto max-w-4xl p-4" aria-busy="true">
      <span className="sr-only">Loading tasks…</span>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Your tasks</h2>
        <div className="flex items-baseline gap-4">
          <span className="h-4 w-20 animate-pulse rounded bg-slate-200" aria-hidden />
          <Link
            to="/tasks/new"
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white shadow hover:bg-indigo-700"
          >
            + New task
          </Link>
        </div>
      </div>
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 p-4">
            <span className="h-4 w-4 animate-pulse rounded bg-slate-200" aria-hidden />
            <span className="h-4 flex-1 animate-pulse rounded bg-slate-200" aria-hidden />
            <span className="h-4 w-8 animate-pulse rounded bg-slate-200" aria-hidden />
            <span className="h-4 w-12 animate-pulse rounded bg-slate-200" aria-hidden />
          </li>
        ))}
      </ul>
    </section>
  );
}

function TaskRow({
  task,
  onToggle,
  onRemove,
}: {
  task: Task;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center gap-3 p-4">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300"
        checked={task.done}
        onChange={onToggle}
        id={'check-' + task.id}
      />
      <label className="flex-1" htmlFor={'check-' + task.id}>
        <span className={task.done ? 'text-slate-400 line-through' : ''}>{task.title}</span>
      </label>
      <Link to={`/tasks/${task.id}/edit`} className="text-sm text-indigo-600 hover:text-indigo-800">
        Edit
      </Link>
      <button className="text-sm text-red-600 hover:text-red-800" onClick={onRemove}>
        Delete
      </button>
    </li>
  );
}
