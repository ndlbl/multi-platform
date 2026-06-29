import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { EMPTY, from, Observable, of } from 'rxjs';
import { catchError, concatMap, map, tap } from 'rxjs/operators';

import { ConnectivityService } from '../core/connectivity.service';
import { OfflineQueueService, QueuedOp } from '../core/offline-queue.service';
import { Task, TaskInput } from './task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private connectivity = inject(ConnectivityService);
  private offlineQueue = inject(OfflineQueueService);
  private readonly baseUrl = '/api/tasks';

  private readonly _tasks = signal<Task[]>([]);
  readonly tasks = this._tasks.asReadonly();
  readonly outstanding = computed(() => this._tasks().filter((t) => !t.done).length);

  load() {
    return this.http.get<Task[]>(this.baseUrl).pipe(
      tap((tasks) => {
        this._tasks.set(tasks);
        // The SW may serve a stale cached response while offline. Re-apply any
        // queued mutations so the UI reflects what the user did this session.
        if (this.connectivity.offline() && this.offlineQueue.taskHasPending()) {
          this.applyQueueOptimistically();
        }
      }),
    );
  }

  create(input: TaskInput): Observable<Task> {
    if (this.connectivity.offline()) {
      const tempTask: Task = {
        id: `local-${Date.now()}`,
        title: input.title,
        done: input.done ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this._tasks.update((list) => [tempTask, ...list]);
      this.offlineQueue.enqueueTask({
        id: crypto.randomUUID(),
        op: 'create',
        tempId: tempTask.id,
        optimisticTask: tempTask,
        payload: input,
      });
      return of(tempTask);
    }
    return this.http
      .post<Task>(this.baseUrl, input)
      .pipe(tap((created) => this._tasks.update((list) => [created, ...list])));
  }

  update(id: string, changes: Partial<TaskInput>): Observable<Task> {
    if (this.connectivity.offline()) {
      const existing = this._tasks().find((t) => t.id === id);
      if (!existing) return EMPTY;
      const optimistic: Task = { ...existing, ...changes, updatedAt: new Date().toISOString() };
      this._tasks.update((list) => list.map((t) => (t.id === id ? optimistic : t)));
      this.offlineQueue.enqueueTask({ id: crypto.randomUUID(), op: 'update', taskId: id, changes });
      return of(optimistic);
    }
    return this.http
      .patch<Task>(`${this.baseUrl}/${id}`, changes)
      .pipe(
        tap((updated) =>
          this._tasks.update((list) => list.map((t) => (t.id === id ? updated : t))),
        ),
      );
  }

  remove(id: string): Observable<void> {
    if (this.connectivity.offline()) {
      this._tasks.update((list) => list.filter((t) => t.id !== id));
      this.offlineQueue.enqueueTask({ id: crypto.randomUUID(), op: 'delete', taskId: id });
      return EMPTY;
    }
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(tap(() => this._tasks.update((list) => list.filter((t) => t.id !== id))));
  }

  getOne(id: string) {
    return this.http.get<Task>(`${this.baseUrl}/${id}`);
  }

  // Replay queued mutations in order against the live API on reconnect
  flush(): Observable<unknown> {
    if (!this.connectivity.online()) return of(null);
    const ops = this.offlineQueue.taskEntries();
    if (ops.length === 0) return of(null);
    return from([...ops]).pipe(concatMap((entry) => this.syncEntry(entry)));
  }

  private syncEntry(entry: QueuedOp): Observable<unknown> {
    switch (entry.op) {
      case 'create':
        return this.http.post<Task>(this.baseUrl, entry.payload).pipe(
          tap((created) => {
            this._tasks.update((list) => list.map((t) => (t.id === entry.tempId ? created : t)));
            this.offlineQueue.replaceTaskTempId(entry.tempId, created.id);
            this.offlineQueue.removeTask(entry.id);
          }),
          catchError(() => {
            this.offlineQueue.removeTask(entry.id);
            return EMPTY;
          }),
        );
      case 'update':
        return this.http.patch<Task>(`${this.baseUrl}/${entry.taskId}`, entry.changes).pipe(
          tap((updated) =>
            this._tasks.update((list) => list.map((t) => (t.id === entry.taskId ? updated : t))),
          ),
          tap(() => this.offlineQueue.removeTask(entry.id)),
          catchError(() => {
            this.offlineQueue.removeTask(entry.id);
            return EMPTY;
          }),
        );
      case 'delete':
        return this.http.delete<void>(`${this.baseUrl}/${entry.taskId}`).pipe(
          tap(() => this.offlineQueue.removeTask(entry.id)),
          catchError(() => {
            this.offlineQueue.removeTask(entry.id);
            return EMPTY;
          }),
        );
    }
  }

  // Re-apply queued mutations onto the current task list if still stale cache
  private applyQueueOptimistically(): void {
    let tasks = [...this._tasks()];
    for (const entry of this.offlineQueue.taskEntries()) {
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
    this._tasks.set(tasks);
  }
}
