import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { tasksApi } from '../api/tasks';

const TaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Maxx 200 characters'),
  done: z.boolean(),
});

type TaskFormValues = z.infer<typeof TaskSchema>;

export default function TaskFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const taskQuery = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksApi.get(id!),
    enabled: isEdit,
  });

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskSchema),
    defaultValues: { title: '', done: false },
    values: taskQuery.data ? { title: taskQuery.data.title, done: taskQuery.data.done } : undefined,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const submitMutation = useMutation({
    mutationFn: (values: TaskFormValues) =>
      isEdit ? tasksApi.update(id!, values) : tasksApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/tasks');
    },
  });

  const onSubmit = handleSubmit((values: TaskFormValues) => submitMutation.mutate(values));

  if (isEdit && taskQuery.isPending) {
    return (
      <p className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-4 text-slate-500">
        Loading…
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-xl p-4">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">
          {isEdit ? 'Edit task' : 'New task'}
        </h2>
        <Link to="/tasks" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back
        </Link>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        {/* Title */}
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            {...register('title')}
            className={`w-full rounded-md border px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              errors.title ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        {/* Done */}
        <div className="flex items-center gap-2">
          <input
            id="done"
            type="checkbox"
            {...register('done')}
            className="h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="done" className="text-sm text-slate-700">
            Mark as done
          </label>
        </div>

        {/* Server error */}
        {submitMutation.isError && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {submitMutation.error.message}
          </p>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Link to="/tasks" className="rounded-md px-4 py-2 text-slate-700 hover:bg-slate-100">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || submitMutation.isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed
  disabled:bg-indigo-300"
          >
            {submitMutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </section>
  );
}
