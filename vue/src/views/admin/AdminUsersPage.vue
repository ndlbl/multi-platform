<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { adminApi } from '../../api/admin';

const usersQuery = useQuery({
  queryKey: ['admin', 'users'],
  queryFn: adminApi.listUsers,
});
</script>

<template>
  <section class="mx-auto max-w-4xl p-4">
    <div class="flex items-baseline justify-between">
      <h2 class="text-2xl font-semibold text-slate-900">All users</h2>
      <span class="text-sm text-slate-500">{{ usersQuery.data.value?.length ?? 0 }} total</span>
    </div>

    <p
      v-if="usersQuery.isPending.value"
      class="rounded-lg border border-slate-200 bg-white p-4 text-slate-500"
    >
      Loading…
    </p>

    <div
      v-else-if="usersQuery.isError.value"
      class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
    >
      {{ usersQuery.error.value?.message }}
      <button class="ml-2 underline" @click="usersQuery.refetch()">Retry</button>
    </div>

    <div
      v-else
      class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-2 text-left">Email</th>
            <th class="px-4 py-2 text-left">Role</th>
            <th class="px-4 py-2 text-right">Tasks</th>
            <th class="px-4 py-2 text-right">Library</th>
            <th class="px-4 py-2 text-left">Joined</th>
            <th class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr
            v-for="u in usersQuery.data.value"
            :key="u.id"
            class="hover:bg-slate-50"
          >
            <td class="px-4 py-3 text-sm text-slate-900">{{ u.email }}</td>
            <td class="px-4 py-3 text-sm">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="
                  u.role === 'admin'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                "
              >
                {{ u.role }}
              </span>
            </td>
            <td class="px-4 py-3 text-right text-sm text-slate-700">{{ u.taskCount }}</td>
            <td class="px-4 py-3 text-right text-sm text-slate-700">{{ u.libraryCount }}</td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ new Date(u.createdAt).toLocaleDateString() }}
            </td>
            <td class="px-4 py-3 text-right">
              <RouterLink
                :to="`/admin/users/${u.id}`"
                class="text-sm text-indigo-600 hover:text-indigo-800"
              >
                View →
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
