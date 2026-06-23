<script setup lang="ts">
// Toasts show errors on form validations and bad requests
import { useToast } from "../composables/useToast";

const { toasts, dismiss } = useToast();
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="flex items-start gap-2 rounded-lg px-4 py-3 text-sm shadow-lg"
      :class="{
        'border border-red-200 bg-red-50 text-red-800': toast.kind === 'error',
        'border border-emerald-200 bg-emerald-50 text-emerald-800': toast.kind === 'success',
        'border border-slate-200 bg-white text-slate-800': toast.kind === 'info',
      }"
    >
      <span class="flex-1">{{ toast.message }}</span>
      <button class="ml-2 text-current opacity-60 hover:opacity-100" aria-label="Dismiss" @click="dismiss(toast.id)">✕</button>
    </div>
  </div>
</template>
