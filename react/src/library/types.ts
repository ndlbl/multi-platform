interface LibraryItemBase {
  readonly id: string;
  title: string;
  addedAt: string;
  consumed: boolean;
  tags?: string[];
}

type Book = LibraryItemBase & {
  kind: 'book';
  author: string;
  pages: number;
};

type Podcast = LibraryItemBase & {
  kind: 'podcast';
  host: string;
  durationMinutes: number;
};

type Article = LibraryItemBase & {
  kind: 'article';
  url: string;
  source: string;
};

export type LibraryItem = Book | Podcast | Article;

export type ItemKind = LibraryItem['kind'];

export const ITEM_KINDS = ['book', 'podcast', 'article'] as const;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type NewLibraryItem = DistributiveOmit<LibraryItem, 'id' | 'addedAt'>;

export type CountsByKind = Record<ItemKind, number>;

export const isBook = (i: LibraryItem): i is Book => i.kind === 'book';

export const isPodcast = (i: LibraryItem): i is Podcast => i.kind === 'podcast';

export const isArticle = (i: LibraryItem): i is Article => i.kind === 'article';
