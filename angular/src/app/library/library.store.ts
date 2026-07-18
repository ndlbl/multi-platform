import { HttpClient } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  addEntity,
  removeEntity,
  setAllEntities,
  setEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  catchError,
  concatMap,
  EMPTY,
  filter,
  from,
  map,
  Observable,
  of,
  pairwise,
  pipe,
  switchMap,
  tap,
  timeout,
} from 'rxjs';

import { ConnectivityService } from '../core/connectivity.service';
import { LibraryQueuedOp, OfflineQueueService } from '../core/offline-queue.service';
import { ToastService } from '../core/toast.service';
import {
  CountsByKind,
  isArticle,
  isBook,
  isPodcast,
  ITEM_KINDS,
  ItemKind,
  LibraryItem,
  LibraryItemUpdate,
  NewLibraryItem,
} from './library.model';

// Safety on hung requests (stuck service-worker fetch on iOS) so the UI
// uses a retryable error instead of spinning forever.
const REQUEST_TIMEOUT_MS = 10_000;
const BASE_URL = '/api/library';

// Distribute Omit across the LibraryItem unions so `kind` survives.
type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;

// `addedAt` arrives as an ISO string; we revive it to a real Date as views below rely on `addedAt.getTime()`
type ApiLibraryItem = DistributiveOmit<LibraryItem, 'addedAt'> & { addedAt: string };

// JSON `addedAt` > string to a Date for the model's `Date` typing
function reviveDates(item: ApiLibraryItem): LibraryItem {
  return { ...item, addedAt: new Date(item.addedAt) } as LibraryItem;
}

export const LibraryStore = signalStore(
  { providedIn: 'root' },
  withEntities<LibraryItem>(),
  withState({
    filterKind: 'all' as ItemKind | 'all',
    searchTerm: '',
    loading: false,
    flushing: false,
    error: null as string | null,
  }),
  withComputed(({ entities, filterKind, searchTerm }) => ({
    filteredItems: computed<readonly LibraryItem[]>(() => {
      const kind = filterKind();
      const term = searchTerm().trim().toLowerCase();

      return entities()
        .filter((i) => kind === 'all' || i.kind === kind)
        .filter((i) => !term || i.title.toLowerCase().includes(term))
        .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
    }),

    countsByKind: computed<CountsByKind>(() => {
      const init = Object.fromEntries(ITEM_KINDS.map((k) => [k, 0])) as CountsByKind;
      return entities().reduce<CountsByKind>((acc, item) => {
        acc[item.kind]++;
        return acc;
      }, init);
    }),

    totalPagesToRead: computed(() =>
      entities()
        .filter(isBook)
        .filter((b) => !b.consumed)
        .reduce((sum, b) => sum + b.pages, 0),
    ),

    listenQueueMinutes: computed(() =>
      entities()
        .filter(isPodcast)
        .filter((p) => !p.consumed)
        .reduce((sum, p) => sum + p.durationMinutes, 0),
    ),

    articleSources: computed(() => {
      const sources = entities()
        .filter(isArticle)
        .map((a) => a.source);
      return [...new Set(sources)];
    }),

    consumedRatio: computed(() => {
      const items = entities();
      if (!items.length) return 0;
      const done = items.filter((i) => i.consumed).length;
      return done / items.length;
    }),

    tagCounts: computed<ReadonlyMap<string, number>>(() => {
      const map = new Map<string, number>();
      for (const item of entities()) {
        for (const tag of item.tags ?? []) {
          map.set(tag, (map.get(tag) ?? 0) + 1);
        }
      }
      return map;
    }),
  })),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      connectivity = inject(ConnectivityService),
      offlineQueue = inject(OfflineQueueService),
      toast = inject(ToastService),
    ) => {
      // Re-apply queued mutations on the current list when stale cache
      function applyQueueOptimistically(): void {
        let items = [...store.entities()];
        for (const entry of offlineQueue.libraryEntries()) {
          if (entry.op === 'create' && !items.find((i) => i.id === entry.tempId)) {
            const optimistic = {
              ...entry.payload,
              id: entry.tempId,
              addedAt: new Date(entry.addedAt),
            } as LibraryItem;
            items = [optimistic, ...items];
          } else if (entry.op === 'update') {
            items = items.map((i) =>
              i.id === entry.itemId ? ({ ...i, ...entry.changes } as LibraryItem) : i,
            );
          } else if (entry.op === 'delete') {
            items = items.filter((i) => i.id !== entry.itemId);
          }
        }
        patchState(store, setAllEntities(items));
      }

      function syncEntry(entry: LibraryQueuedOp): Observable<unknown> {
        switch (entry.op) {
          case 'create':
            return http.post<ApiLibraryItem>(BASE_URL, entry.payload).pipe(
              map(reviveDates),
              tap((created) => {
                patchState(store, removeEntity(entry.tempId), addEntity(created));
                offlineQueue.replaceLibraryTempId(entry.tempId, created.id);
                offlineQueue.removeLibrary(entry.id);
              }),
              catchError(() => {
                offlineQueue.removeLibrary(entry.id);
                return EMPTY;
              }),
            );
          case 'update':
            return http.patch<ApiLibraryItem>(`${BASE_URL}/${entry.itemId}`, entry.changes).pipe(
              map(reviveDates),
              tap((updated) => patchState(store, setEntity(updated))),
              tap(() => offlineQueue.removeLibrary(entry.id)),
              catchError(() => {
                offlineQueue.removeLibrary(entry.id);
                return EMPTY;
              }),
            );
          case 'delete':
            return http.delete<void>(`${BASE_URL}/${entry.itemId}`).pipe(
              tap(() => offlineQueue.removeLibrary(entry.id)),
              catchError(() => {
                offlineQueue.removeLibrary(entry.id);
                return EMPTY;
              }),
            );
        }
      }

      function update(id: string, changes: LibraryItemUpdate): Observable<LibraryItem> {
        if (connectivity.offline()) {
          const existing = store.entityMap()[id];
          if (!existing) return EMPTY;
          const optimistic = { ...existing, ...changes } as LibraryItem;
          patchState(store, setEntity(optimistic));
          offlineQueue.enqueueLibrary({
            id: crypto.randomUUID(),
            op: 'update',
            itemId: id,
            changes,
          });
          return of(optimistic);
        }
        return http.patch<ApiLibraryItem>(`${BASE_URL}/${id}`, changes).pipe(
          map(reviveDates),
          tap((updated) => patchState(store, setEntity(updated))),
        );
      }

      return {
        setSearch(value: string): void {
          patchState(store, { searchTerm: value });
        },

        setKind(value: ItemKind | 'all'): void {
          patchState(store, { filterKind: value });
        },

        load: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            switchMap(() => {
              if (connectivity.offline()) {
                if (offlineQueue.libraryHasPending()) applyQueueOptimistically();
                patchState(store, { loading: false });
                return EMPTY;
              }
              return http.get<ApiLibraryItem[]>(BASE_URL).pipe(
                timeout(REQUEST_TIMEOUT_MS),
                map((items) => items.map(reviveDates)),
                tap((items) => patchState(store, setAllEntities(items), { loading: false })),
                catchError((err) => {
                  patchState(store, {
                    loading: false,
                    error: err.message ?? 'Failed to load library',
                  });
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        add(input: NewLibraryItem): Observable<LibraryItem> {
          if (connectivity.offline()) {
            const now = new Date();
            const optimistic = { ...input, id: `local-${Date.now()}`, addedAt: now } as LibraryItem;
            patchState(store, addEntity(optimistic));
            offlineQueue.enqueueLibrary({
              id: crypto.randomUUID(),
              op: 'create',
              tempId: optimistic.id,
              payload: input,
              addedAt: now.toISOString(),
            });
            return of(optimistic);
          }
          return http.post<ApiLibraryItem>(BASE_URL, input).pipe(
            map(reviveDates),
            tap((created) => patchState(store, addEntity(created))),
          );
        },

        update,

        toggleConsumed(id: string): Observable<LibraryItem> {
          return update(id, { consumed: !store.entityMap()[id]?.consumed });
        },

        remove(id: string): Observable<void> {
          if (connectivity.offline()) {
            patchState(store, removeEntity(id));
            offlineQueue.enqueueLibrary({ id: crypto.randomUUID(), op: 'delete', itemId: id });
            return EMPTY;
          }
          return http
            .delete<void>(`${BASE_URL}/${id}`)
            .pipe(tap(() => patchState(store, removeEntity(id))));
        },

        // Replay queued mutations in order against the API for offline->online transition in onInit, so
        // it fires on reconnect.
        flush: rxMethod<void>(
          pipe(
            switchMap(() => {
              if (!connectivity.online()) return EMPTY;
              const ops = offlineQueue.libraryEntries();
              if (ops.length === 0) return EMPTY;
              patchState(store, { flushing: true });
              return from([...ops]).pipe(
                concatMap((entry) => syncEntry(entry)),
                tap({
                  complete: () => {
                    patchState(store, { flushing: false });
                    toast.show(
                      `${ops.length} library change${ops.length === 1 ? '' : 's'} synced`,
                      'success',
                    );
                  },
                }),
              );
            }),
          ),
        ),
      };
    },
  ),
  withHooks({
    onInit(store) {
      const connectivity = inject(ConnectivityService);
      // Detect offline -> online transition and trigger a flush.
      const reconnected$ = toObservable(connectivity.online).pipe(
        pairwise(),
        filter(([prev, curr]) => !prev && curr),
        map(() => undefined),
      );
      store.flush(reconnected$);
    },
  }),
);
