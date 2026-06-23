import type { LibraryItem } from './types';

export const SEED: readonly LibraryItem[] = [
  {
    id: '1',
    kind: 'book',
    title: "You Don't Know JS",
    author: 'Kyle Simpson',
    pages: 280,
    addedAt: '2025-12-01',
    consumed: true,
    tags: ['js', 'fundamentals'],
  },
  {
    id: '2',
    kind: 'podcast',
    title: 'Syntax',
    host: 'Wes Bos & Scott',
    durationMinutes: 60,
    addedAt: '2026-04-12',
    consumed: false,
    tags: ['web', 'frontend'],
  },
  {
    id: '3',
    kind: 'article',
    title: 'Inside the V8 JS Engine',
    url: 'https://example.com',
    source: 'V8 Blog',
    addedAt: '2026-05-15',
    consumed: false,
    tags: ['js', 'engine'],
  },
  {
    id: '4',
    kind: 'book',
    title: 'Effective TypeScript',
    author: 'Dan Vanderkam',
    pages: 240,
    addedAt: '2026-01-04',
    consumed: false,
    tags: ['ts'],
  },
];
