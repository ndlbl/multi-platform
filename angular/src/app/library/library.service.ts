import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { EMPTY, from, Observable, of } from 'rxjs';
import { catchError, concatMap, map, tap } from 'rxjs/operators';

import { ConnectivityService } from '../core/connectivity.service';
import { LibraryQueuedOp, OfflineQueueService } from '../core/offline-queue.service';
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

// Distribute Omit across the LibraryItem union so the discriminated `kind` survives.
type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;

/**
 * Wire shape returned by the API. JSON has no Date type, so `addedAt` arrives as an
 * ISO string; we revive it to a real Date at the HTTP boundary (see `reviveDates`)
 * because the computed views below rely on `addedAt.getTime()`.
 */
type ApiLibraryItem = DistributiveOmit<LibraryItem, 'addedAt'> & { addedAt: string };

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly http = inject(HttpClient);
  private readonly connectivity = inject(ConnectivityService);
  private readonly offlineQueue = inject(OfflineQueueService);
  private readonly baseUrl = '/api/library';

  private readonly _items = signal<LibraryItem[]>([]);
  readonly items = this._items.asReadonly();

  // filterUIState
  readonly filterKind = signal<ItemKind | 'all'>('all');
  readonly searchTerm = signal('');

  // derived/computed views
  readonly filteredItems = computed<readonly LibraryItem[]>(() => {
    const kind = this.filterKind();
    const term = this.searchTerm().trim().toLowerCase();

    return this._items()
      .filter((i) => kind === 'all' || i.kind === kind)
      .filter((i) => !term || i.title.toLowerCase().includes(term))
      .toSorted((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  });

  readonly countsByKind = computed<CountsByKind>(() => {
    const init = Object.fromEntries(ITEM_KINDS.map((k) => [k, 0])) as CountsByKind;
    return this._items().reduce<CountsByKind>((acc, item) => {
      acc[item.kind]++;
      return acc;
    }, init);
  });

  readonly totalPagesToRead = computed(() =>
    this._items()
      .filter(isBook)
      .filter((b) => !b.consumed)
      .reduce((sum, b) => sum + b.pages, 0),
  );
  readonly listenQueueMinutes = computed(() =>
    this._items()
      .filter(isPodcast)
      .filter((p) => !p.consumed)
      .reduce((sum, p) => sum + p.durationMinutes, 0),
  );

  readonly ArticleSources = computed(() => {
    const sources = this._items()
      .filter(isArticle)
      .map((a) => a.source);
    return [...new Set(sources)];
  });

  readonly consumedRatio = computed(() => {
    const items = this._items();
    if (!items.length) return 0;
    const done = items.filter((i) => i.consumed).length;
    return done / items.length;
  });

  readonly tagCounts = computed<ReadonlyMap<string, number>>(() => {
    const map = new Map<string, number>();
    for (const item of this._items()) {
      for (const tag of item.tags ?? []) {
        map.set(tag, (map.get(tag) ?? 0) + 1);
      }
    }
    return map;
  });

  //lokup table by id
  readonly byId = computed<ReadonlyMap<string, LibraryItem>>(
    () => new Map(this._items().map((i) => [i.id, i] as const)),
  );

  // COMMANDS (HTTP-backed, mirrors TaskService)

  load() {
    return this.http.get<ApiLibraryItem[]>(this.baseUrl).pipe(
      map((items) => items.map(reviveDates)),
      tap((items) => {
        this._items.set(items);
        // The SW may serve a stale cached response while offline. Re-apply queued mutations.
        if (this.connectivity.offline() && this.offlineQueue.libraryHasPending()) {
          this.applyQueueOptimistically();
        }
      }),
    );
  }

  add(input: NewLibraryItem): Observable<LibraryItem> {
    if (this.connectivity.offline()) {
      const now = new Date();
      const optimistic = { ...input, id: `local-${Date.now()}`, addedAt: now } as LibraryItem;
      this._items.update((list) => [optimistic, ...list]);
      this.offlineQueue.enqueueLibrary({
        id: crypto.randomUUID(),
        op: 'create',
        tempId: optimistic.id,
        payload: input,
        addedAt: now.toISOString(),
      });
      return of(optimistic);
    }
    return this.http.post<ApiLibraryItem>(this.baseUrl, input).pipe(
      map(reviveDates),
      tap((created) => this._items.update((list) => [created, ...list])),
    );
  }

  update(id: string, changes: LibraryItemUpdate): Observable<LibraryItem> {
    if (this.connectivity.offline()) {
      const existing = this._items().find((i) => i.id === id);
      if (!existing) return EMPTY;
      const optimistic = { ...existing, ...changes } as LibraryItem;
      this._items.update((list) => list.map((i) => (i.id === id ? optimistic : i)));
      this.offlineQueue.enqueueLibrary({
        id: crypto.randomUUID(),
        op: 'update',
        itemId: id,
        changes,
      });
      return of(optimistic);
    }
    return this.http.patch<ApiLibraryItem>(`${this.baseUrl}/${id}`, changes).pipe(
      map(reviveDates),
      tap((updated) => this._items.update((list) => list.map((i) => (i.id === id ? updated : i)))),
    );
  }

  toggleConsumed(id: string) {
    return this.update(id, { consumed: !this.byId().get(id)?.consumed });
  }

  remove(id: string): Observable<void> {
    if (this.connectivity.offline()) {
      this._items.update((list) => list.filter((i) => i.id !== id));
      this.offlineQueue.enqueueLibrary({ id: crypto.randomUUID(), op: 'delete', itemId: id });
      return EMPTY;
    }
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(tap(() => this._items.update((list) => list.filter((i) => i.id !== id))));
  }

  // Replay queued library mutations against the live API on reconnect
  flush(): Observable<unknown> {
    if (!this.connectivity.online()) return of(null);
    const ops = this.offlineQueue.libraryEntries();
    if (ops.length === 0) return of(null);
    return from([...ops]).pipe(concatMap((entry) => this.syncEntry(entry)));
  }

  groupBy<T, K extends PropertyKey>(items: readonly T[], keyFn: (item: T) => K): Record<K, T[]> {
    return items.reduce(
      (acc, item) => {
        const key = keyFn(item);
        (acc[key] ??= []).push(item);
        return acc;
      },
      {} as Record<K, T[]>,
    );
  }

  private syncEntry(entry: LibraryQueuedOp): Observable<unknown> {
    switch (entry.op) {
      case 'create':
        return this.http.post<ApiLibraryItem>(this.baseUrl, entry.payload).pipe(
          map(reviveDates),
          tap((created) => {
            this._items.update((list) => list.map((i) => (i.id === entry.tempId ? created : i)));
            this.offlineQueue.replaceLibraryTempId(entry.tempId, created.id);
            this.offlineQueue.removeLibrary(entry.id);
          }),
          catchError(() => {
            this.offlineQueue.removeLibrary(entry.id);
            return EMPTY;
          }),
        );
      case 'update':
        return this.http
          .patch<ApiLibraryItem>(`${this.baseUrl}/${entry.itemId}`, entry.changes)
          .pipe(
            map(reviveDates),
            tap((updated) =>
              this._items.update((list) => list.map((i) => (i.id === entry.itemId ? updated : i))),
            ),
            tap(() => this.offlineQueue.removeLibrary(entry.id)),
            catchError(() => {
              this.offlineQueue.removeLibrary(entry.id);
              return EMPTY;
            }),
          );
      case 'delete':
        return this.http.delete<void>(`${this.baseUrl}/${entry.itemId}`).pipe(
          tap(() => this.offlineQueue.removeLibrary(entry.id)),
          catchError(() => {
            this.offlineQueue.removeLibrary(entry.id);
            return EMPTY;
          }),
        );
    }
  }

  // Re-apply queued mutations on the current list when still has stale cache
  private applyQueueOptimistically(): void {
    let items = [...this._items()];
    for (const entry of this.offlineQueue.libraryEntries()) {
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
    this._items.set(items);
  }
}

/** JSON `addedAt` > string to a Date for the model's `Date` typing. */
function reviveDates(item: ApiLibraryItem): LibraryItem {
  return { ...item, addedAt: new Date(item.addedAt) } as LibraryItem;
}
