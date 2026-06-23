import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, tap } from 'rxjs';

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
  private readonly baseUrl = '/api/library';

  private readonly _items = signal<LibraryItem[]>([]);
  readonly items = this._items.asReadonly();

  //filterUIState
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

  // COMMANDS (HTTP-backed, mirrors TaskService) ------------------------------

  load() {
    return this.http.get<ApiLibraryItem[]>(this.baseUrl).pipe(
      map((items) => items.map(reviveDates)),
      tap((items) => this._items.set(items)),
    );
  }

  add(input: NewLibraryItem) {
    return this.http.post<ApiLibraryItem>(this.baseUrl, input).pipe(
      map(reviveDates),
      tap((created) => this._items.update((list) => [created, ...list])),
    );
  }

  update(id: string, changes: LibraryItemUpdate) {
    return this.http.patch<ApiLibraryItem>(`${this.baseUrl}/${id}`, changes).pipe(
      map(reviveDates),
      tap((updated) => this._items.update((list) => list.map((i) => (i.id === id ? updated : i)))),
    );
  }

  toggleConsumed(id: string) {
    return this.update(id, { consumed: !this.byId().get(id)?.consumed });
  }

  remove(id: string) {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(tap(() => this._items.update((list) => list.filter((i) => i.id !== id))));
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
}

/** Revive the JSON `addedAt` string into a Date so the model's `Date` typing holds at runtime. */
function reviveDates(item: ApiLibraryItem): LibraryItem {
  return { ...item, addedAt: new Date(item.addedAt) } as LibraryItem;
}
