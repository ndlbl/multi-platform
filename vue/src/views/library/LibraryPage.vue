<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { libraryApi } from "../../api/library";
import type { CountsByKind, ItemKind, LibraryItem } from "../../library/types";
import { isBook, isPodcast, ITEM_KINDS } from "../../library/types";
import AddLibraryItemForm from "./AddLibraryItemForm.vue";

const queryClient = useQueryClient();
const libraryQuery = useQuery({
  queryKey: ["library"],
  queryFn: libraryApi.list,
});

const invalidate = () => queryClient.invalidateQueries({ queryKey: ["library"] });

const toggleMutation = useMutation({
  mutationFn: ({ id, consumed }: { id: string; consumed: boolean }) => libraryApi.update(id, { consumed: !consumed }),
  onSuccess: invalidate,
});

const removeMutation = useMutation({
  mutationFn: (id: string) => libraryApi.remove(id),
  onSuccess: invalidate,
});

const filterKind = ref<ItemKind | "all">("all");
const searchTerm = ref("");

const items = computed<LibraryItem[]>(() => libraryQuery.data.value ?? []);

const filteredItems = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  return items.value
    .filter((i) => filterKind.value === "all" || i.kind === filterKind.value)
    .filter((i) => !term || i.title.toLowerCase().includes(term))
    .toSorted((a, b) => b.addedAt.localeCompare(a.addedAt));
});

const countsByKind = computed<CountsByKind>(() => {
  const init = Object.fromEntries(ITEM_KINDS.map((k) => [k, 0])) as CountsByKind;
  return items.value.reduce<CountsByKind>((acc, i) => {
    acc[i.kind]++;
    return acc;
  }, init);
});

const totalPagesToRead = computed(() =>
  items.value
    .filter(isBook)
    .filter((b) => !b.consumed)
    .reduce((s, b) => s + b.pages, 0),
);

const listenQueueMinutes = computed(() =>
  items.value
    .filter(isPodcast)
    .filter((p) => !p.consumed)
    .reduce((s, p) => s + p.durationMinutes, 0),
);

const consumedRatio = computed(() => {
  if (items.value.length === 0) return 0;
  return items.value.filter((i) => i.consumed).length / items.value.length;
});
</script>

<template>
  <section class="mx-auto max-w-4xl space-y-6 p-4">
    <div class="flex items-baseline justify-between">
      <h2 class="text-2xl font-semibold text-slate-900">Library</h2>
      <span class="text-sm text-slate-500"> {{ items.length }} item{{ items.length === 1 ? "" : "s" }} </span>
    </div>

    <div class="flex justify-end">
      <button type="button" command="show-modal" commandfor="add-item-dialog" class="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white shadow hover:bg-indigo-700">Add new item</button>
    </div>

    <dialog id="add-item-dialog" closedby="any" class="w-full max-w-md rounded-xl p-0 backdrop:bg-slate-900/40">
      <div class="relative">
        <button type="button" command="close" commandfor="add-item-dialog" aria-label="Close" class="absolute right-2 top-2 z-10 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">✕</button>
        <AddLibraryItemForm @added="(document.getElementById('add-item-dialog') as HTMLDialogElement)?.close()" />
      </div>
    </dialog>

    <div class="grid grid-cols-3 gap-3">
      <div v-for="kind in ITEM_KINDS" :key="kind" class="rounded-lg border border-slate-200 bg-white p-3">
        <div class="text-xs uppercase tracking-wide text-slate-500">{{ kind }}s</div>
        <div class="text-xl font-semibold text-slate-900">{{ countsByKind[kind] }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="rounded-lg border border-slate-200 bg-white p-3">
        <div class="text-slate-500">Consumed</div>
        <div class="text-lg font-semibold">{{ Math.round(consumedRatio * 100) }}%</div>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-3">
        <div class="text-slate-500">Pages to read</div>
        <div class="text-lg font-semibold">{{ totalPagesToRead.toLocaleString() }}</div>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-3">
        <div class="text-slate-500">Listen queue</div>
        <div class="text-lg font-semibold">{{ listenQueueMinutes }} min</div>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 text-sm">
      <input v-model="searchTerm" type="text" placeholder="Search titles…" class="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <label for="filterKind" class="sr-only">Kind:</label>
      <select id="filterKind" v-model="filterKind" class="rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="all">All kinds</option>
        <option v-for="k in ITEM_KINDS" :key="k" :value="k">{{ k }}</option>
      </select>
    </div>

    <div v-if="libraryQuery.isError.value" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {{ libraryQuery.error.value?.message }}
      <button class="ml-2 underline" @click="libraryQuery.refetch()">Retry</button>
    </div>

    <ul v-if="libraryQuery.isPending.value" class="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white" aria-busy="true" aria-label="Loading library">
      <li v-for="row in 4" :key="row" class="flex items-start gap-3 p-4">
        <span class="mt-1 h-4 w-4 animate-pulse rounded bg-slate-200" />
        <div class="flex-1 space-y-2">
          <span class="block h-4 w-1/2 animate-pulse rounded bg-slate-200" />
          <span class="block h-3 w-1/3 animate-pulse rounded bg-slate-200" />
          <div class="flex gap-2 pt-1">
            <span class="h-3 w-10 animate-pulse rounded bg-slate-200" />
            <span class="h-3 w-10 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </li>
    </ul>

    <ul v-else class="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      <li v-if="filteredItems.length === 0" class="p-6 text-center text-slate-500">No items match those filters.</li>
      <li v-for="item in filteredItems" :key="item.id" class="flex items-start gap-3 p-4">
        <input :id="'check-' + item.id" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300" :checked="item.consumed" @change="toggleMutation.mutate({ id: item.id, consumed: item.consumed })" />
        <div class="flex-1">
          <div class="flex items-baseline justify-between gap-2">
            <label :for="'check-' + item.id">
              <h3 class="font-medium" :class="item.consumed ? 'text-slate-600 line-through' : 'text-slate-900'">
                {{ item.title }}
              </h3>
            </label>
            <span class="text-sm text-slate-600">{{ item.kind }}</span>
          </div>

          <p class="mt-1 text-sm text-slate-600">
            <template v-if="item.kind === 'book'"> {{ item.author }} · {{ item.pages }} pages </template>
            <template v-else-if="item.kind === 'podcast'"> {{ item.host }} · {{ item.durationMinutes }} min </template>
            <template v-else-if="item.kind === 'article'">
              <a :href="item.url" target="_blank" class="text-indigo-600 underline">
                {{ item.source }}
              </a>
            </template>
          </p>

          <div v-if="item.tags?.length" class="mt-2 flex flex-wrap py-1">
            <span v-for="tag in item.tags" :key="tag" class="mr-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"> #{{ tag }} </span>
          </div>

          <button class="text-sm text-red-600 hover:text-red-800" @click="removeMutation.mutate(item.id)">Remove</button>
        </div>
      </li>
    </ul>
  </section>
</template>
