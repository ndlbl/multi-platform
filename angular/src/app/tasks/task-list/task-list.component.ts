import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TaskService } from '../task.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  readonly tasks = this.taskService.tasks;
  readonly outstanding = this.taskService.outstanding;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.taskService.load().subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.error.set(err.message ?? 'Failed to load tasks');
        this.loading.set(false);
      },
    });
  }

  toggle(id: string, done: boolean): void {
    this.taskService.update(id, { done: !done }).subscribe();
  }

  remove(id: string): void {
    this.taskService.remove(id).subscribe();
  }
}
