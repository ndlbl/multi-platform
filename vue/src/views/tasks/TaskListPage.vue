<script setup lang="ts">
import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { tasksApi } from '../../api/tasks';

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

const outstanding = computed(
  () => tasksQuery.data.value?.filter((t) => !t.done).length ?? 0,
);
</script>

<template>
  <section class="mx-auto max-w-4xl p-4">
    <div class="mb-4 flex items-baseline justify-between">
      <h2 class="text-2xl font-semibold text-slate-900">Your tasks</h2>
      <div class="flex items-baseline gap-4">
        <span class="text-sm text-slate-500">{{ outstanding }} outstanding</span>
        <RouterLink
          to="/tasks/new"
          class="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white shadow hover:bg-indigo-700"
        >
          + New task
        </RouterLink>
      </div>
    </div>

    <ul
      v-if="tasksQuery.isPending.value"
      class="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm"
      aria-busy="true"
      aria-label="Loading tasks"
    >
      <li v-for="row in 5" :key="row" class="flex items-center gap-3 p-4">
        <span class="h-4 w-4 animate-pulse rounded bg-slate-200" />
        <span class="h-4 flex-1 animate-pulse rounded bg-slate-200" />
        <span class="h-4 w-8 animate-pulse rounded bg-slate-200" />
        <span class="h-4 w-12 animate-pulse rounded bg-slate-200" />
      </li>
    </ul>

    <div
      v-else-if="tasksQuery.isError.value"
      class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
    >
      {{ tasksQuery.error.value?.message }}
      <button class="ml-2 underline" @click="tasksQuery.refetch()">Retry</button>
    </div>

    <ul
      v-else
      class="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <li
        v-if="!tasksQuery.data.value?.length"
        class="p-4 text-center text-slate-500"
      >
        No tasks yet.
      </li>
      <li
        v-for="task in tasksQuery.data.value"
        :key="task.id"
        class="flex items-center gap-3 p-4"
      >
        <input
          :id="'check-' + task.id"
          type="checkbox"
          class="h-4 w-4 rounded border-slate-300"
          :checked="task.done"
          @change="toggleMutation.mutate({ id: task.id, done: task.done })"
        />
        <label :for="'check-' + task.id" class="flex-1">
          <span :class="task.done ? 'line-through text-slate-400' : ''">{{ task.title }}</span>
        </label>
        <RouterLink
          :to="`/tasks/${task.id}/edit`"
          class="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Edit
        </RouterLink>
        <button
          class="text-sm text-red-600 hover:text-red-800"
          @click="removeMutation.mutate(task.id)"
        >
          Delete
        </button>
      </li>
    </ul>
  </section>
</template>
