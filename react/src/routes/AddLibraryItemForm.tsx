import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type Resolver, useForm, type UseFormRegister, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { libraryApi } from '../api/library';
import type { NewLibraryItem } from '../library/types';

const titleField = z.string().min(1, 'Title is required').max(200, 'Max 200 characters');

const FormSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('book'),
    title: titleField,
    tagsCsv: z.string(),
    author: z.string().min(1, 'Author is required'),
    pages: z.number({ error: 'Pages is required' }).int().min(1, 'Pages must be at least 1'),
  }),
  z.object({
    kind: z.literal('podcast'),
    title: titleField,
    tagsCsv: z.string(),
    host: z.string().min(1, 'Host is required'),
    durationMinutes: z
      .number({ error: 'Duration is required' })
      .int()
      .min(1, 'Duration must be at least 1'),
  }),
  z.object({
    kind: z.literal('article'),
    title: titleField,
    tagsCsv: z.string(),
    url: z.string().min(1, 'URL is required'),
    source: z.string().min(1, 'Source is required'),
  }),
]);

type FormOutput = z.infer<typeof FormSchema>;

type FormInput = {
  kind: 'book' | 'podcast' | 'article';
  title: string;
  tagsCsv: string;
  author?: string;
  pages?: number;
  host?: string;
  durationMinutes?: number;
  url?: string;
  source?: string;
};

export default function AddLibraryItemForm({ onAdded }: { onAdded?: () => void }) {
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(FormSchema) as unknown as Resolver<FormInput, unknown, FormOutput>,
    defaultValues: { kind: 'book', title: '', tagsCsv: '' },
  });

  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (input: NewLibraryItem) => libraryApi.create(input),
    onSuccess: (_created, variables) => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      reset({ kind: variables.kind, title: '', tagsCsv: '' });
      // Only fires after the server confirms the write, parent closes the dialog here.
      onAdded?.();
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = form;

  const kind = useWatch({ control, name: 'kind', defaultValue: 'book' });
  const onSubmit = handleSubmit((data) => {
    const tags = data.tagsCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let newItem: NewLibraryItem;
    switch (data.kind) {
      case 'book':
        newItem = {
          kind: 'book',
          title: data.title,
          consumed: false,
          tags,
          author: data.author,
          pages: data.pages,
        };
        break;
      case 'podcast':
        newItem = {
          kind: 'podcast',
          title: data.title,
          consumed: false,
          tags,
          host: data.host,
          durationMinutes: data.durationMinutes,
        };
        break;
      case 'article':
        newItem = {
          kind: 'article',
          title: data.title,
          consumed: false,
          tags,
          url: data.url,
          source: data.source,
        };
        break;
    }

    addMutation.mutate(newItem);
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-smm"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-slate-900">Add new item</h3>
      </div>
      {/* Kind selector — drives the form layout/elements */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">Kind</label>
        <select
          {...register('kind')}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="book">book</option>
          <option value="podcast">podcast</option>
          <option value="article">article</option>
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">Title</label>
        <input
          type="text"
          {...register('title')}
          className={`w-full rounded-md border px-3 py-2 text-sm ${
            errors.title ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">
          Tags <span className="text-slate-400">(comma-separated)</span>
        </label>
        <input
          type="text"
          placeholder="js, fundamentals"
          {...register('tagsCsv')}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {/* Kind-specific fields */}
      {kind === 'book' && (
        <div className="grid grid-cols-2 gap-3">
          <FieldText
            label="Author"
            name="author"
            register={register}
            error={errors.author?.message}
          />
          <FieldNumber
            label="Pages"
            name="pages"
            register={register}
            error={errors.pages?.message}
          />
        </div>
      )}

      {kind === 'podcast' && (
        <div className="grid grid-cols-2 gap-3">
          <FieldText label="Host" name="host" register={register} error={errors.host?.message} />
          <FieldNumber
            label="Duration (min)"
            name="durationMinutes"
            register={register}
            error={errors.durationMinutes?.message}
          />
        </div>
      )}

      {kind === 'article' && (
        <div className="space-y-3">
          <FieldText
            label="URL"
            name="url"
            type="url"
            placeholder="https://…"
            register={register}
            error={errors.url?.message}
          />
          <FieldText
            label="Source"
            name="source"
            placeholder="MDN, V8 Blog, …"
            register={register}
            error={errors.source?.message}
          />
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={addMutation.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed
  disabled:bg-indigo-300"
        >
          {addMutation.isPending ? 'Adding…' : 'Add to library'}
        </button>

        {addMutation.isError && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {addMutation.error.message}
          </p>
        )}
      </div>
    </form>
  );
}

function FieldText({
  label,
  name,
  type = 'text',
  placeholder,
  register,
  error,
}: {
  label: string;
  name: keyof FormInput;
  type?: string;
  placeholder?: string;
  register: UseFormRegister<FormInput>;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-700">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={`w-full rounded-md border px-3 py-2 text-sm ${
          error ? 'border-red-500' : 'border-slate-300'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function FieldNumber({
  label,
  name,
  register,
  error,
}: {
  label: string;
  name: 'pages' | 'durationMinutes';
  register: UseFormRegister<FormInput>;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-700">{label}</label>
      <input
        type="number"
        min={1}
        {...register(name, { valueAsNumber: true })}
        className={`w-full rounded-md border px-3 py-2 text-sm ${
          error ? 'border-red-500' : 'border-slate-300'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
