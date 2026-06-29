import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { LibraryItemUpdate, NewLibraryItem } from '../library/library.model';
import { Task, TaskInput } from '../tasks/task.model';

const TASKS_KEY = 'tm_offline_queue';
const LIBRARY_KEY = 'tm_offline_library_queue';

// Task queue types

export type QueuedOp =
  | { id: string; op: 'create'; tempId: string; optimisticTask: Task; payload: TaskInput }
  | { id: string; op: 'update'; taskId: string; changes: Partial<TaskInput> }
  | { id: string; op: 'delete'; taskId: string };

// Library queue types
// addedAt is stored as an ISO string for JSON serialisation.

export type LibraryQueuedOp =
  | { id: string; op: 'create'; tempId: string; payload: NewLibraryItem; addedAt: string }
  | { id: string; op: 'update'; itemId: string; changes: LibraryItemUpdate }
  | { id: string; op: 'delete'; itemId: string };

// Service

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  // isPlatformBrowser: localStorage does not exist in the Node/SSR, so storage access is gated via flag.
  private readonly storageAvailable = isPlatformBrowser(inject(PLATFORM_ID));

  // Tasks

  private readonly _taskEntries = signal<QueuedOp[]>(this.loadFrom<QueuedOp>(TASKS_KEY));
  readonly taskEntries = this._taskEntries.asReadonly();
  readonly taskCount = computed(() => this._taskEntries().length);
  readonly taskHasPending = computed(() => this._taskEntries().length > 0);

  enqueueTask(op: QueuedOp): void {
    this._taskEntries.update((list) => [...list, op]);
    this.persistTo(TASKS_KEY, this._taskEntries());
  }

  removeTask(entryId: string): void {
    this._taskEntries.update((list) => list.filter((e) => e.id !== entryId));
    this.persistTo(TASKS_KEY, this._taskEntries());
  }

  // After a queued create syncs the server returns a real ID wo rewrite any
  // subsequent queue entries that still reference the client ID.
  replaceTaskTempId(tempId: string, realId: string): void {
    this._taskEntries.update((list) =>
      list.map((e) => {
        if ((e.op === 'update' || e.op === 'delete') && e.taskId === tempId) {
          return { ...e, taskId: realId };
        }
        return e;
      }),
    );
    this.persistTo(TASKS_KEY, this._taskEntries());
  }

  // Library

  private readonly _libraryEntries = signal<LibraryQueuedOp[]>(
    this.loadFrom<LibraryQueuedOp>(LIBRARY_KEY),
  );
  readonly libraryEntries = this._libraryEntries.asReadonly();
  readonly libraryCount = computed(() => this._libraryEntries().length);
  readonly libraryHasPending = computed(() => this._libraryEntries().length > 0);

  enqueueLibrary(op: LibraryQueuedOp): void {
    this._libraryEntries.update((list) => [...list, op]);
    this.persistTo(LIBRARY_KEY, this._libraryEntries());
  }

  removeLibrary(entryId: string): void {
    this._libraryEntries.update((list) => list.filter((e) => e.id !== entryId));
    this.persistTo(LIBRARY_KEY, this._libraryEntries());
  }

  replaceLibraryTempId(tempId: string, realId: string): void {
    this._libraryEntries.update((list) =>
      list.map((e) => {
        if ((e.op === 'update' || e.op === 'delete') && e.itemId === tempId) {
          return { ...e, itemId: realId };
        }
        return e;
      }),
    );
    this.persistTo(LIBRARY_KEY, this._libraryEntries());
  }

  // Helpers

  readonly totalPending = computed(
    () => this._taskEntries().length + this._libraryEntries().length,
  );

  private loadFrom<T>(key: string): T[] {
    if (!this.storageAvailable) return [];
    try {
      return JSON.parse(localStorage.getItem(key) ?? '[]');
    } catch {
      return [];
    }
  }

  private persistTo(key: string, value: unknown[]): void {
    if (!this.storageAvailable) return;
    localStorage.setItem(key, JSON.stringify(value));
  }
}
