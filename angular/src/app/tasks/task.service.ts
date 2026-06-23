import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';

import { Task, TaskInput } from './task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/tasks';

  // reactive state
  private readonly _tasks = signal<Task[]>([]);
  readonly tasks = this._tasks.asReadonly();
  readonly outstanding = computed(() => this._tasks().filter((t) => !t.done).length);

  // CRUD operations
  load() {
    return this.http.get<Task[]>(this.baseUrl).pipe(tap((tasks) => this._tasks.set(tasks)));
  }

  create(input: TaskInput) {
    return this.http
      .post<Task>(this.baseUrl, input)
      .pipe(tap((created) => this._tasks.update((list) => [created, ...list])));
  }

  update(id: string, changes: Partial<TaskInput>) {
    return this.http
      .patch<Task>(`${this.baseUrl}/${id}`, changes)
      .pipe(
        tap((updated) =>
          this._tasks.update((list) => list.map((t) => (t.id === id ? updated : t))),
        ),
      );
  }

  remove(id: string) {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(tap(() => this._tasks.update((list) => list.filter((t) => t.id !== id))));
  }

  getOne(id: string) {
    return this.http.get<Task>(`${this.baseUrl}/${id}`);
  }

  //constructor() { }
}
