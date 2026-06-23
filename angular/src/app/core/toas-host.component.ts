import { Component, inject } from '@angular/core';

import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      @for (t of toast.toasts(); track t.id) {
        <div
          class="flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg"
          [class]="classFor(t.kind)"
        >
          <span class="flex-1">{{ t.message }}</span>
          <button class="text-current/60 hover:text-current" (click)="toast.dismiss(t.id)">
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  protected toast = inject(ToastService);

  protected classFor(kind: 'info' | 'error' | 'success'): string {
    switch (kind) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  }
}
