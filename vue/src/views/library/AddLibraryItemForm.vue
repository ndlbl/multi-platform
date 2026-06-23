<script setup lang="ts">
import { ref, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { libraryApi } from '../../api/library';
import type { NewLibraryItem } from '../../library/types';

const emit = defineEmits<{ added: [] }>();

const titleField = z.string().min(1, 'Title is required').max(200, 'Max 200 characters');

const BookSchema = z.object({
  kind: z.literal('book'),
  title: titleField,
  tagsCsv: z.string(),
  author: z.string().min(1, 'Author is required'),
  pages: z.coerce.number({ error: 'Pages is required' }).int().min(1, 'Must be at least 1'),
});

const PodcastSchema = z.object({
  kind: z.literal('podcast'),
  title: titleField,
  tagsCsv: z.string(),
  host: z.string().min(1, 'Host is required'),
  durationMinutes: z.coerce
    .number({ error: 'Duration is required' })
    .int()
    .min(1, 'Must be at least 1'),
});

const ArticleSchema = z.object({
  kind: z.literal('article'),
  title: titleField,
  tagsCsv: z.string(),
  url: z.string().min(1, 'URL is required'),
  source: z.string().min(1, 'Source is required'),
});

const FormSchema = toTypedSchema(z.discriminatedUnion('kind', [BookSchema, PodcastSchema, ArticleSchema]));

const kind = ref<'book' | 'podcast' | 'article'>('book');

const { defineField, handleSubmit, errors, resetForm, setFieldValue } = useForm({
  validationSchema: FormSchema,
  initialValues: { kind: 'book' as const, title: '', tagsCsv: '', author: '', host: '', url: '', source: '' },
});

const [kindField, kindAttrs] = defineField('kind');
const [title, titleAttrs] = defineField('title');
const [tagsCsv, tagsAttrs] = defineField('tagsCsv');
const [author, authorAttrs] = defineField('author');
const [pages, pagesAttrs] = defineField('pages');
const [host, hostAttrs] = defineField('host');
const [durationMinutes, durationAttrs] = defineField('durationMinutes');
const [url, urlAttrs] = defineField('url');
const [source, sourceAttrs] = defineField('source');

watch(kind, (newKind) => {
  setFieldValue('kind', newKind);
});

const queryClient = useQueryClient();

const addMutation = useMutation({
  mutationFn: (input: NewLibraryItem) => libraryApi.create(input),
  onSuccess: (_created, variables) => {
    queryClient.invalidateQueries({ queryKey: ['library'] });
    resetForm({ values: { kind: variables.kind as 'book' | 'podcast' | 'article', title: '', tagsCsv: '' } });
    kind.value = variables.kind as 'book' | 'podcast' | 'article';
    emit('added');
  },
});

const submitError = ref('');

const onSubmit = handleSubmit((data) => {
  submitError.value = '';
  const tags = (data.tagsCsv ?? '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  let newItem: NewLibraryItem;
  if (data.kind === 'book') {
    newItem = {
      kind: 'book',
      title: data.title,
      consumed: false,
      tags,
      author: data.author ?? '',
      pages: data.pages ?? 0,
    };
  } else if (data.kind === 'podcast') {
    newItem = {
      kind: 'podcast',
      title: data.title,
      consumed: false,
      tags,
      host: data.host ?? '',
      durationMinutes: data.durationMinutes ?? 0,
    };
  } else {
    newItem = {
      kind: 'article',
      title: data.title,
      consumed: false,
      tags,
      url: data.url ?? '',
      source: data.source ?? '',
    };
  }

  addMutation.mutate(newItem);
});
</script>

<template>
  <form
    class="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    @submit="onSubmit"
  >
    <div class="flex items-baseline justify-between">
      <h3 class="text-base font-semibold text-slate-900">Add new item</h3>
    </div>

    <div>
      <label for="kind-field" class="mb-1 block text-xs font-medium text-slate-700">Kind</label>
      <select
        id="kind-field"
        name="kind"
        v-model="kind"
        v-bind="kindAttrs"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        @change="setFieldValue('kind', kind)"
      >
        <option value="book">book</option>
        <option value="podcast">podcast</option>
        <option value="article">article</option>
      </select>
    </div>

    <div>
      <label for="title-field" class="mb-1 block text-xs font-medium text-slate-700">Title</label>
      <input
        id="title-field"
        name="title"
        v-model="title"
        v-bind="titleAttrs"
        type="text"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        :class="errors.title ? 'border-red-500' : ''"
      />
      <p v-if="errors.title" class="mt-1 text-xs text-red-600">{{ errors.title }}</p>
    </div>

    <div>
      <label for="tags-field" class="mb-1 block text-xs font-medium text-slate-700">
        Tags <span class="text-slate-400">(comma-separated)</span>
      </label>
      <input
        id="tags-field"
        v-model="tagsCsv"
        v-bind="tagsAttrs"
        type="text"
        placeholder="js, typescript, webdev"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
    </div>

    <div v-if="kind === 'book'" class="grid grid-cols-2 gap-3">
      <div>
        <label for="author-field" class="mb-1 block text-xs font-medium text-slate-700">
          Author
        </label>
        <input
          id="author-field"
          name="author"
          v-model="author"
          v-bind="authorAttrs"
          type="text"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          :class="errors.author ? 'border-red-500' : ''"
        />
        <p v-if="errors.author" class="mt-1 text-xs text-red-600">{{ errors.author }}</p>
      </div>
      <div>
        <label for="pages-field" class="mb-1 block text-xs font-medium text-slate-700">
          Pages
        </label>
        <input
          id="pages-field"
          name="pages"
          v-model="pages"
          v-bind="pagesAttrs"
          type="number"
          min="1"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          :class="errors.pages ? 'border-red-500' : ''"
        />
        <p v-if="errors.pages" class="mt-1 text-xs text-red-600">{{ errors.pages }}</p>
      </div>
    </div>

    <div v-if="kind === 'podcast'" class="grid grid-cols-2 gap-3">
      <div>
        <label for="host-field" class="mb-1 block text-xs font-medium text-slate-700">Host</label>
        <input
          id="host-field"
          v-model="host"
          v-bind="hostAttrs"
          type="text"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          :class="errors.host ? 'border-red-500' : ''"
        />
        <p v-if="errors.host" class="mt-1 text-xs text-red-600">{{ errors.host }}</p>
      </div>
      <div>
        <label for="duration-field" class="mb-1 block text-xs font-medium text-slate-700">
          Duration (min)
        </label>
        <input
          id="duration-field"
          v-model="durationMinutes"
          v-bind="durationAttrs"
          type="number"
          min="1"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          :class="errors.durationMinutes ? 'border-red-500' : ''"
        />
        <p v-if="errors.durationMinutes" class="mt-1 text-xs text-red-600">
          {{ errors.durationMinutes }}
        </p>
      </div>
    </div>

    <div v-if="kind === 'article'" class="space-y-3">
      <div>
        <label for="url-field" class="mb-1 block text-xs font-medium text-slate-700">URL</label>
        <input
          id="url-field"
          v-model="url"
          v-bind="urlAttrs"
          type="url"
          placeholder="https://…"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          :class="errors.url ? 'border-red-500' : ''"
        />
        <p v-if="errors.url" class="mt-1 text-xs text-red-600">{{ errors.url }}</p>
      </div>
      <div>
        <label for="source-field" class="mb-1 block text-xs font-medium text-slate-700">
          Source
        </label>
        <input
          id="source-field"
          v-model="source"
          v-bind="sourceAttrs"
          type="text"
          placeholder="MDN, V8 Blog, …"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          :class="errors.source ? 'border-red-500' : ''"
        />
        <p v-if="errors.source" class="mt-1 text-xs text-red-600">{{ errors.source }}</p>
      </div>
    </div>

    <div class="flex items-center justify-end gap-3 pt-2">
      <p
        v-if="submitError"
        class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700"
      >
        {{ submitError }}
      </p>
      <button
        type="submit"
        :disabled="addMutation.isPending.value"
        class="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {{ addMutation.isPending.value ? 'Adding…' : 'Add to library' }}
      </button>
    </div>
  </form>
</template>
