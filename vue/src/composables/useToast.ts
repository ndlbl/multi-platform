import { ref } from 'vue';

export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

let nextId = 0;
const toasts = ref<Toast[]>([]);

function dismiss(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

function show(message: string, kind: ToastKind = 'info', ttlMs = 4000) {
  const toast: Toast = { id: ++nextId, kind, message };
  toasts.value = [...toasts.value, toast];
  setTimeout(() => dismiss(toast.id), ttlMs);
}

function error(message: string) {
  show(message, 'error');
}

function success(message: string) {
  show(message, 'success');
}

export function useToast() {
  return { toasts, show, error, success, dismiss };
}
