import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminService, UserSummary } from '../../core/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);

  readonly users = signal<UserSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.listUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error ?? err.message ?? 'Failed to load');
        this.loading.set(false);
      },
    });
  }
}
