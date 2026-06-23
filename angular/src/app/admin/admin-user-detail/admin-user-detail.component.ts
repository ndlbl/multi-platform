import { DatePipe } from '@angular/common';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AdminService } from '../../core/admin.service';
import { User } from '../../core/auth.service';
import { LibraryItem } from '../../library/library.model';
import { Task } from '../../tasks/task.model';

@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './admin-user-detail.component.html',
})
export class AdminUserDetailComponent implements OnInit {
  private adminService = inject(AdminService);

  // Bound from the route param ':id' via withComponentInputBinding (already enabled)
  readonly id = input<string>();

  readonly user = signal<User | null>(null);
  readonly tasks = signal<Task[]>([]);
  readonly library = signal<LibraryItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

    // forkJoin runs all three requests in PARALLEL and emits once they
    // ALL complete. The Angular equivalent of awaiting Promise.all,
    // and the Angular equivalent of React's three parallel useQuery hooks.
    forkJoin({
      user: this.adminService.getUser(id),
      tasks: this.adminService.getUserTasks(id),
      library: this.adminService.getUserLibrary(id),
    }).subscribe({
      next: ({ user, tasks, library }) => {
        this.user.set(user);
        this.tasks.set(tasks);
        this.library.set(library);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error ?? err.message ?? 'Failed to load');
        this.loading.set(false);
      },
    });
  }
}
