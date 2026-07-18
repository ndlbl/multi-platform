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
import { OfflineQueueService, QueuedOp } from '../core/offline-queue.service';
import { ToastService } from '../core/toast.service';
import { Task, TaskInput } from './task.model';

// Safety net on hung requests (e.g. service-worker fetch on iOS) so the UI
// uses a retryable error instead of spinning forever.
const REQUEST_TIMEOUT_MS = 10_000;
const BASE_URL = '/api/tasks';

export const TaskStore = signalStore(
  { providedIn: 'root' },
  withEntities<Task>(),
  withState({
    loading: false,
    flushing: false,
    error: null as string | null,
  }),
  withComputed(({ entities }) => ({
    outstanding: computed(() => entities().filter((t) => !t.done).length),
  })),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      connectivity = inject(ConnectivityService),
      offlineQueue = inject(OfflineQueueService),
      toast = inject(ToastService),
    ) => {
      // Re-apply queued mutations onto the current task list if stale cache
      function applyQueueOptimistically(): void {
        let tasks = [...store.entities()];
        for (const entry of offlineQueue.taskEntries()) {
          if (entry.op === 'create' && !tasks.find((t) => t.id === entry.tempId)) {
            tasks = [entry.optimisticTask, ...tasks];
          } else if (entry.op === 'update') {
            tasks = tasks.map((t) =>
              t.id === entry.taskId
                ? { ...t, ...entry.changes, updatedAt: new Date().toISOString() }
                : t,
            );
          } else if (entry.op === 'delete') {
            tasks = tasks.filter((t) => t.id !== entry.taskId);
          }
        }
        patchState(store, setAllEntities(tasks));
      }

      function syncEntry(entry: QueuedOp): Observable<unknown> {
        switch (entry.op) {
          case 'create':
            return http.post<Task>(BASE_URL, entry.payload).pipe(
              tap((created) => {
                patchState(store, removeEntity(entry.tempId), addEntity(created));
                offlineQueue.replaceTaskTempId(entry.tempId, created.id);
                offlineQueue.removeTask(entry.id);
              }),
              catchError(() => {
                offlineQueue.removeTask(entry.id);
                return EMPTY;
              }),
            );
          case 'update':
            return http.patch<Task>(`${BASE_URL}/${entry.taskId}`, entry.changes).pipe(
              tap((updated) => patchState(store, setEntity(updated))),
              tap(() => offlineQueue.removeTask(entry.id)),
              catchError(() => {
                offlineQueue.removeTask(entry.id);
                return EMPTY;
              }),
            );
          case 'delete':
            return http.delete<void>(`${BASE_URL}/${entry.taskId}`).pipe(
              tap(() => offlineQueue.removeTask(entry.id)),
              catchError(() => {
                offlineQueue.removeTask(entry.id);
                return EMPTY;
              }),
            );
        }
      }

      return {
        load: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            switchMap(() => {
              // When offline, skip the network request entirely — entities already hold
              // data from this session. Re-apply any queued mutations and stop loading.
              if (connectivity.offline()) {
                if (offlineQueue.taskHasPending()) applyQueueOptimistically();
                patchState(store, { loading: false });
                return EMPTY;
              }
              return http.get<Task[]>(BASE_URL).pipe(
                timeout(REQUEST_TIMEOUT_MS),
                tap((tasks) => patchState(store, setAllEntities(tasks), { loading: false })),
                catchError((err) => {
                  patchState(store, {
                    loading: false,
                    error: err.message ?? 'Failed to load tasks',
                  });
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        create(input: TaskInput): Observable<Task> {
          if (connectivity.offline()) {
            const tempTask: Task = {
              id: `local-${Date.now()}`,
              title: input.title,
              done: input.done ?? false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            patchState(store, addEntity(tempTask));
            offlineQueue.enqueueTask({
              id: crypto.randomUUID(),
              op: 'create',
              tempId: tempTask.id,
              optimisticTask: tempTask,
              payload: input,
            });
            return of(tempTask);
          }
          return http
            .post<Task>(BASE_URL, input)
            .pipe(tap((created) => patchState(store, addEntity(created))));
        },

        update(id: string, changes: Partial<TaskInput>): Observable<Task> {
          if (connectivity.offline()) {
            const existing = store.entityMap()[id];
            if (!existing) return EMPTY;
            const patch = { ...changes, updatedAt: new Date().toISOString() };
            patchState(store, setEntity({ ...existing, ...patch }));
            offlineQueue.enqueueTask({
              id: crypto.randomUUID(),
              op: 'update',
              taskId: id,
              changes,
            });
            return of({ ...existing, ...patch });
          }
          return http
            .patch<Task>(`${BASE_URL}/${id}`, changes)
            .pipe(tap((updated) => patchState(store, setEntity(updated))));
        },

        remove(id: string): Observable<void> {
          if (connectivity.offline()) {
            patchState(store, removeEntity(id));
            offlineQueue.enqueueTask({ id: crypto.randomUUID(), op: 'delete', taskId: id });
            return EMPTY;
          }
          return http
            .delete<void>(`${BASE_URL}/${id}`)
            .pipe(tap(() => patchState(store, removeEntity(id))));
        },

        getOne(id: string): Observable<Task> {
          return http.get<Task>(`${BASE_URL}/${id}`);
        },

        // Replay queued mutations in order against the API. Bound to offline->online transition in onInit, so
        // it fires on reconnect.
        flush: rxMethod<void>(
          pipe(
            switchMap(() => {
              if (!connectivity.online()) return EMPTY;
              const ops = offlineQueue.taskEntries();
              if (ops.length === 0) return EMPTY;
              patchState(store, { flushing: true });
              return from([...ops]).pipe(
                concatMap((entry) => syncEntry(entry)),
                tap({
                  complete: () => {
                    patchState(store, { flushing: false });
                    toast.show(
                      `${ops.length} task change${ops.length === 1 ? '' : 's'} synced`,
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
