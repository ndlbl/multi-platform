import { DecimalPipe, PercentPipe } from '@angular/common';
import { afterNextRender, Component, inject, OnInit, signal } from '@angular/core';

import { AddLibraryItemComponent } from '../add-library-item/add-library-item.component';
import { ITEM_KINDS, ItemKind } from '../library.model';
import { LibraryStore } from '../library.store';

@Component({
  selector: 'app-library-list',
  imports: [DecimalPipe, PercentPipe, AddLibraryItemComponent],
  templateUrl: './library-list.component.html',
  styleUrl: './library-list.component.scss',
})
export class LibraryListComponent implements OnInit {
  protected readonly lib = inject(LibraryStore);

  protected readonly kinds = ['all', ...ITEM_KINDS] as const;

  // The command/commandfor Invoker Commands API isn't implemented everywhere yet
  // (notably iOS/macOS Safari as of writing) — feature-detect once on the client and
  // fall back to imperative showModal()/close() where it's unsupported. Defaults to
  // false for SSR (HTMLButtonElement doesn't exist on the server).
  protected readonly supportsInvokerCommands = signal(false);

  constructor() {
    afterNextRender(() => {
      this.supportsInvokerCommands.set('command' in HTMLButtonElement.prototype);
    });
  }

  ngOnInit(): void {
    this.lib.load();
  }

  protected setSearch(value: string): void {
    this.lib.setSearch(value);
  }

  protected setKind(value: ItemKind | 'all'): void {
    this.lib.setKind(value);
  }

  protected toggle(id: string): void {
    this.lib.toggleConsumed(id).subscribe();
  }

  protected remove(id: string): void {
    this.lib.remove(id).subscribe();
  }
}
