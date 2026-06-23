<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useRoute } from 'vue-router';
import { adminApi } from '../../api/admin';
import type { LibraryItem } from '../../library/types';

const route = useRoute();
const id = computed(() => route.params.id as string);

const userQuery = useQuery({
  queryKey: computed(() => ['admin', 'users', id.value]),
  queryFn: () => adminApi.getUser(id.value),
  enabled: computed(() => !!id.value),
});

const tasksQuery = useQuery({
  queryKey: computed(() => ['admin', 'users', id.value, 'tasks']),
  queryFn: () => adminApi.getUserTasks(id.value),
  enabled: computed(() => !!id.value),
});

const libraryQuery = useQuery({
  queryKey: computed(() => ['admin', 'users', id.value, 'library']),
  queryFn: () => adminApi.getUserLibrary(id.value),
  enabled: computed(() => !!id.value),
});

const loading = computed(
  () =>
    userQuery.isPending.value ||
    tasksQuery.isPending.value ||
    libraryQuery.isPending.value,
);

const tasks = computed(() => tasksQuery.data.value ?? []);
const library = computed(() => libraryQuery.data.value ?? []);

function itemDetail(item: LibraryItem): string {
  if (item.kind === 'book') return `${item.author} · ${item.pages} pages`;
  if (item.kind === 'podcast') return `${item.host} · ${item.durationMinutes} min`;
  return '';
}
</script>

<template>
  <section class="mx-auto max-w-4xl p-4">
    <RouterLink to="/admin" class="text-sm text-slate-600 hover:text-slate-900">
      ← All users
    </RouterLink>

    <p
      v-if="loading"
      class="rounded-lg border border-slate-200 bg-white p-4 text-slate-500"
    >
      Loading…
    </p>

    <p
      v-else-if="userQuery.isError.value"
      class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
    >
      {{ userQuery.error.value?.message }}
    </p>

    <template v-else-if="userQuery.data.value">
      <div>
        <div class="flex items-baseline justify-between">
          <h2 class="text-2xl font-semibold text-slate-900">{{ userQuery.data.value.email }}</h2>
          <span
            class="rounded-full px-3 py-1 text-xs font-medium"
            :class="
              userQuery.data.value.role === 'admin'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-700'
            "
          >
            {{ userQuery.data.value.role }}
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500">
          Joined {{ new Date(userQuery.data.value.createdAt).toLocaleDateString() }}
        </p>
      </div>

      <section>
        <h3 class="mb-3 text-lg font-semibold text-slate-900">
          Tasks <span class="text-slate-400">({{ tasks.length }})</span>
        </h3>
        <p
          v-if="tasks.length === 0"
          class="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500"
        >
          No tasks.
        </p>
        <ul
          v-else
          class="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white"
        >
          <li
            v-for="task in tasks"
            :key="task.id"
            class="flex items-center gap-3 p-3 text-sm"
          >
            <span
              class="flex h-4 w-4 items-center justify-center rounded border text-xs"
              :class="
                task.done
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-300'
              "
            >
              <template v-if="task.done">✓</template>
            </span>
            <span :class="task.done ? 'text-slate-400 line-through' : 'text-slate-900'">
              {{ task.title }}
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h3 class="mb-3 text-lg font-semibold text-slate-900">
          Library <span class="text-slate-400">({{ library.length }})</span>
        </h3>
        <p
          v-if="library.length === 0"
          class="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500"
        >
          No library items.
        </p>
        <ul
          v-else
          class="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white"
        >
          <li
            v-for="item in library"
            :key="item.id"
            class="flex items-start gap-3 p-3 text-sm"
          >
            <span
              class="mt-0.5 flex h-4 w-4 items-center justify-center rounded border text-xs"
              :class="
                item.consumed
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-300'
              "
            >
              <template v-if="item.consumed">✓</template>
            </span>
            <div class="flex-1">
              <div class="flex items-baseline justify-between gap-2">
                <span :class="item.consumed ? 'text-slate-400 line-through' : 'text-slate-900'">
                  {{ item.title }}
                </span>
                <span class="text-xs uppercase text-slate-400">{{ item.kind }}</span>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                <template v-if="item.kind === 'article'">
                  <a
                    :href="item.url"
                    target="_blank"
                    rel="noreferrer"
                    class="text-indigo-600 underline"
                  >
                    {{ item.source }}
                  </a>
                </template>
                <template v-else>{{ itemDetail(item) }}</template>
              </p>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>
