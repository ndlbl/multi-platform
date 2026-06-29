import { afterNextRender, computed, Injectable, signal } from '@angular/core';
import { fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly _online = signal(true); // default true: handle for SSR which could otherwise result in failed navigation
  readonly online = this._online.asReadonly();
  readonly offline = computed(() => !this._online());

  constructor() {
    // afterNextRender - fires in the browser, not during SSR —
    // so navigator and window can work succesully.
    afterNextRender(() => {
      this._online.set(navigator.onLine);

      merge(
        fromEvent(window, 'online').pipe(map(() => true)),
        fromEvent(window, 'offline').pipe(map(() => false)),
      ).subscribe((isOnline) => this._online.set(isOnline));
    });
  }
}
