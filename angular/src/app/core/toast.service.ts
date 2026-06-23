import { Injectable, signal } from '@angular/core';
export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly _toasts = signal<readonly Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  error(message: string): void {
    this.show(message, 'error');
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  show(message: string, kind: ToastKind = 'info', ttlMs = 4000): void {
    const toast: Toast = { id: ++this.nextId, kind, message };
    this._toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), ttlMs);
  }
}
