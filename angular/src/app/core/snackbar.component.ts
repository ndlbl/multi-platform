import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  template: `
    <div
      role="status"
      aria-live="polite"
      class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg bg-slate-800 px-5 py-3 text-sm text-white shadow-lg"
    >
      <span>{{ message() }}</span>
      @if (action()) {
        <button
          (click)="actionClick.emit()"
          class="font-semibold text-indigo-300 hover:text-indigo-100"
        >
          {{ action() }}
        </button>
      }
      <button
        (click)="dismissed.emit()"
        aria-label="Dismiss"
        class="ml-1 text-slate-400 hover:text-white"
      >
        ✕
      </button>
    </div>
  `,
})
export class SnackbarComponent {
  readonly message = input.required<string>();
  readonly action = input<string>();
  readonly actionClick = output<void>();
  readonly dismissed = output<void>();
}
