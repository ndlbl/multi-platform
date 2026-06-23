interface LibraryItemBase {
  readonly id: string;
  title: string;
  addedAt: Date;
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

//const test: ItemKind = ITEM_KINDS[0];   // ✓
//const test2: ItemKind = 'movie'; // x

// server/service defines id and addedAt so the 'new' form doesnt need these fields.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type NewLibraryItem = DistributiveOmit<LibraryItem, 'id' | 'addedAt'>;

// same shape but make all fields optional - for PATCH Semantics
type DistributivePartial<T> = T extends unknown ? Partial<T> : never;
export type LibraryItemUpdate = DistributivePartial<DistributiveOmit<LibraryItem, 'id' | 'kind'>>;
// Key/Value map shorthand for counters...
export type CountsByKind = Record<ItemKind, number>;

// item is Book is what makes this a typegurad and not just a function that returns a boolean. It tells the compiler that if this function returns true, then the item is of type Book and you can safely access Book-specific properties like author and pages.
export function isBook(item: LibraryItem): item is Book {
  return item.kind === 'book';
}

export function isPodcast(item: LibraryItem): item is Podcast {
  return item.kind === 'podcast';
}

export function isArticle(item: LibraryItem): item is Article {
  return item.kind === 'article';
}

export function describe(item: LibraryItem): string {
  switch (item.kind) {
    case 'book':
      return `${item.title} by ${item.author}`;
    case 'podcast':
      return `${item.title} hosted by ${item.host}`;
    case 'article':
      return `${item.title} from ${item.source}`;
    default: {
      const _exhaustive: never = item;
      throw new Error(`Unhandled item kind: ${_exhaustive}`);
    }
  }
}
