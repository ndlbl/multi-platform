import type { LibraryItem, NewLibraryItem } from '../library/types';
import { api } from './client';

type LibraryItemUpdate = Partial<Pick<LibraryItem, 'title' | 'consumed' | 'tags'>>;

export const libraryApi = {
  list: () => api<LibraryItem[]>('/api/library'),
  get: (id: string) => api<LibraryItem>(`/api/library/${id}`),
  create: (input: NewLibraryItem) =>
    api<LibraryItem>('/api/library', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, changes: LibraryItemUpdate) =>
    api<LibraryItem>(`/api/library/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  remove: (id: string) => api<void>(`/api/library/${id}`, { method: 'DELETE' }),
};
