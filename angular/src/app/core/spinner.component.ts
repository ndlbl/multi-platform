import { Component, inject } from '@angular/core';

import { LoadingService } from './loading.service';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    @if (loading.isLoading()) {
      <div class="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
        <div
          class="h-full w-1/3 animate-pulse bg-indigo-600
                      [animation-duration:1s]"
        ></div>
      </div>
    }
  `,
})
export class SpinnerComponent {
  protected loading = inject(LoadingService);
}
