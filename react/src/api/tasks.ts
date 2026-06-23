import { api } from './client';

export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  done?: boolean;
}

export const tasksApi = {
  list: () => api<Task[]>('/api/tasks'),
  get: (id: string) => api<Task>(`/api/tasks/${id}`),
  create: (input: TaskInput) =>
    api<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, changes: Partial<TaskInput>) =>
    api<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  remove: (id: string) => api<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
};
