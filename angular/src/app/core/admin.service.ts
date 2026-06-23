import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { LibraryItem } from '../library/library.model';
import { Task } from '../tasks/task.model';
import { User } from './auth.service';

export interface UserSummary {
  id: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  libraryCount: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  listUsers() {
    return this.http.get<UserSummary[]>('/api/admin/users');
  }

  getUser(id: string) {
    return this.http.get<User>(`/api/admin/users/${id}`);
  }

  getUserTasks(id: string) {
    return this.http.get<Task[]>(`/api/admin/users/${id}/tasks`);
  }

  getUserLibrary(id: string) {
    return this.http.get<LibraryItem[]>(`/api/admin/users/${id}/library`);
  }
}
