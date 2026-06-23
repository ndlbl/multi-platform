<script setup lang="ts">
// The spinner shows page load progress bar (flat blue bar at the top of the app)
import { computed } from "vue";
import { useIsFetching, useIsMutating } from "@tanstack/vue-query";

const isFetching = useIsFetching();
const isMutating = useIsMutating();
const busy = computed(() => isFetching.value + isMutating.value > 0);
</script>

<template>
  <div v-if="busy" class="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
    <div class="h-full w-1/3 animate-pulse bg-indigo-600 [animation-duration:1s]" />
  </div>
</template>
