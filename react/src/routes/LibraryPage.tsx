import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';

import { libraryApi } from '../api/library';
import type { CountsByKind, ItemKind, LibraryItem } from '../library/types';
import { isBook, isPodcast, ITEM_KINDS } from '../library/types';
import AddLibraryItemForm from './AddLibraryItemForm';
const EMPTY_ITEMS: LibraryItem[] = [];

export default function LibraryPage() {
  const queryClient = useQueryClient();

  // Server state
  const libraryQuery = useQuery({
    queryKey: ['library'],
    queryFn: libraryApi.list,
  });

  // Mutations
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['library'] });

  const toggleMutation = useMutation({
    mutationFn: ({ id, consumed }: { id: string; consumed: boolean }) =>
      libraryApi.update(id, { consumed: !consumed }),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => libraryApi.remove(id),
    onSuccess: invalidate,
  });

  // Local UI
  const [filterKind, setFilterKind] = useState<ItemKind | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Derived
  const items = libraryQuery.data ?? EMPTY_ITEMS;

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items
      .filter((i) => filterKind === 'all' || i.kind === filterKind)
      .filter((i) => !term || i.title.toLowerCase().includes(term))
      .toSorted((a, b) => b.addedAt.localeCompare(a.addedAt));
  }, [items, filterKind, searchTerm]);

  const countsByKind = useMemo<CountsByKind>(() => {
    const init = Object.fromEntries(ITEM_KINDS.map((k) => [k, 0])) as CountsByKind;
    return items.reduce<CountsByKind>((acc, i) => {
      acc[i.kind]++;
      return acc;
    }, init);
  }, [items]);

  const totalPagesToRead = useMemo(
    () =>
      items
        .filter(isBook)
        .filter((b) => !b.consumed)
        .reduce((s, b) => s + b.pages, 0),
    [items],
  );

  const listenQueueMinutes = useMemo(
    () =>
      items
        .filter(isPodcast)
        .filter((p) => !p.consumed)
        .reduce((s, p) => s + p.durationMinutes, 0),
    [items],
  );

  const consumedRatio = useMemo(() => {
    if (items.length === 0) return 0;
    return items.filter((i) => i.consumed).length / items.length;
  }, [items]);

  //  Loading / error gates ──
  if (libraryQuery.isPending) {
    return <LibraryPageSkeleton />;
  }

  if (libraryQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {libraryQuery.error.message}
        <button className="ml-2 underline" onClick={() => libraryQuery.refetch()}>
          Retry
        </button>
      </div>
    );
  }

  //  Render
  return (
    <section className="mx-auto max-w-4xl p-4 space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Library</h2>
        <span className="text-sm text-slate-500">
          {items.length} item{items.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          command="show-modal"
          commandfor="add-item-dialog"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white shadow hover:bg-indigo-700"
        >
          Add new item
        </button>
      </div>

      <dialog
        ref={dialogRef}
        id="add-item-dialog"
        closedby="any"
        className="w-full max-w-md rounded-xl p-0 backdrop:bg-slate-900/40"
      >
        <div className="relative">
          <button
            type="button"
            command="close"
            commandfor="add-item-dialog"
            aria-label="Close"
            className="absolute right-2 top-2 z-10 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
          <AddLibraryItemForm onAdded={() => dialogRef.current?.close()} />
        </div>
      </dialog>

      <div className="grid grid-cols-3 gap-3">
        {ITEM_KINDS.map((kind) => (
          <div key={kind} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">{kind}s</div>
            <div className="text-xl font-semibold text-slate-900">{countsByKind[kind]}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Consumed" value={`${Math.round(consumedRatio * 100)}%`} />
        <Stat label="Pages to read" value={totalPagesToRead.toLocaleString()} />
        <Stat label="Listen queue" value={`${listenQueueMinutes} min`} />
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search titles…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value as ItemKind | 'all')}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">All kinds</option>
          {ITEM_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {filteredItems.length === 0 ? (
          <li className="p-6 text-center text-slate-500">No items match those filters.</li>
        ) : (
          filteredItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onToggle={() => toggleMutation.mutate({ id: item.id, consumed: item.consumed })}
              onRemove={() => removeMutation.mutate(item.id)}
            />
          ))
        )}
      </ul>
    </section>
  );
}

// Sub-components

function LibraryPageSkeleton() {
  return (
    <section className="mx-auto max-w-4xl space-y-6" aria-busy="true">
      <span className="sr-only">Loading library…</span>
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Library</h2>
        <span className="h-4 w-16 animate-pulse rounded bg-slate-200" aria-hidden />
      </div>

      {/* Per-kind count cards */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
            <span className="block h-3 w-12 animate-pulse rounded bg-slate-200" aria-hidden />
            <span className="block h-6 w-8 animate-pulse rounded bg-slate-200" aria-hidden />
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
            <span className="block h-3 w-16 animate-pulse rounded bg-slate-200" aria-hidden />
            <span className="block h-5 w-12 animate-pulse rounded bg-slate-200" aria-hidden />
          </div>
        ))}
      </div>

      {/* Items */}
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="flex items-start gap-3 p-4">
            <span className="mt-1 h-4 w-4 animate-pulse rounded bg-slate-200" aria-hidden />
            <div className="flex-1 space-y-2">
              <span className="block h-4 w-1/2 animate-pulse rounded bg-slate-200" aria-hidden />
              <span className="block h-3 w-1/3 animate-pulse rounded bg-slate-200" aria-hidden />
              <div className="flex gap-2 pt-1">
                <span className="h-3 w-10 animate-pulse rounded bg-slate-200" aria-hidden />
                <span className="h-3 w-10 animate-pulse rounded bg-slate-200" aria-hidden />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function ItemRow({
  item,
  onToggle,
  onRemove,
}: {
  item: LibraryItem;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-start gap-3 p-4">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300"
        checked={item.consumed}
        onChange={onToggle}
        id={'check-' + item.id}
      />
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="{'check-' + item.id}">
            <h3
              className={`font-medium ${item.consumed ? 'text-slate-400 line-through' : 'text-slate-900'}`}
            >
              {item.title}
            </h3>
          </label>
          <span className="text-xs uppercase text-slate-400">{item.kind}</span>
        </div>

        <p className="mt-1 text-sm text-slate-600">
          <ItemDetail item={item} />
        </p>

        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <button onClick={onRemove} className="text-sm text-red-600 hover:text-red-800">
        Remove
      </button>
    </li>
  );
}

// discriminated-union narrowing

function ItemDetail({ item }: { item: LibraryItem }) {
  switch (item.kind) {
    case 'book':
      // item narrowed to Book
      return (
        <>
          {item.author} · {item.pages.toLocaleString()} pages
        </>
      );
    case 'podcast':
      // item narrowed to Podcast
      return (
        <>
          {item.host} · {item.durationMinutes} min
        </>
      );
    case 'article':
      // item narrowed to Article
      return (
        <a href={item.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
          {item.source}
        </a>
      );
    default: {
      // Exhaustiveness check, add other items kinds later and this line errors until that kind is handled.
      const _never: never = item;
      return _never;
    }
  }
}
