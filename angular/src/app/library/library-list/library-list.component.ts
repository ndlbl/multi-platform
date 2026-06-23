import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';

import { AddLibraryItemComponent } from '../add-library-item/add-library-item.component';
import { ITEM_KINDS, ItemKind } from '../library.model';
import { LibraryService } from '../library.service';

@Component({
  selector: 'app-library-list',
  imports: [DecimalPipe, PercentPipe, AddLibraryItemComponent],
  templateUrl: './library-list.component.html',
  styleUrl: './library-list.component.scss',
})
export class LibraryListComponent implements OnInit {
  protected lib = inject(LibraryService);

  protected readonly kinds = ['all', ...ITEM_KINDS] as const;
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.fetch();
  }

  protected fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.lib.load().subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.error.set(err.message ?? 'Failed to load library');
        this.loading.set(false);
      },
    });
  }

  protected setSearch(value: string): void {
    this.lib.searchTerm.set(value);
  }

  protected setKind(value: ItemKind | 'all'): void {
    this.lib.filterKind.set(value);
  }

  protected toggle(id: string): void {
    this.lib.toggleConsumed(id).subscribe();
  }

  protected remove(id: string): void {
    this.lib.remove(id).subscribe();
  }
}
