import type { LibraryItem } from '../library/types';
import type { User } from './auth';
import { api } from './client';
import type { Task } from './tasks';

export interface UserSummary {
  id: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  libraryCount: number;
}

export const adminApi = {
  listUsers: () => api<UserSummary[]>('/api/admin/users'),
  getUser: (id: string) => api<User>(`/api/admin/users/${id}`),
  getUserTasks: (id: string) => api<Task[]>(`/api/admin/users/${id}/tasks`),
  getUserLibrary: (id: string) => api<LibraryItem[]>(`/api/admin/users/${id}/library`),
};
