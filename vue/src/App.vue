<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";
import { useCurrentUser } from "./composables/useCurrentUser";
import { queryClient } from "./queryClient";
import GlobalSpinner from "./components/GlobalSpinner.vue";
import ToastHost from "./components/ToastHost.vue";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const userQuery = useCurrentUser();

const currentUser = computed(() => userQuery.data.value ?? null);
const hydrated = ref(false);
const menuOpen = ref(false);

onMounted(() => {
  hydrated.value = true;
});

// Close mobile menu on any navigation
watch(() => route.path, () => {
  menuOpen.value = false;
});

function logout() {
  auth.logout();
  queryClient.clear();
  router.push("/login");
}
</script>

<template>
  <GlobalSpinner />
  <div class="min-h-screen bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-4xl items-center justify-between p-4">
        <RouterLink to="/" class="flex items-center gap-2 text-xl font-bold text-slate-900">
          <img src="/icons/icon-96x96.png" alt="" aria-hidden="true" class="h-8 w-8" />
          <span class="sr-only sm:not-sr-only">Task Manager</span>
        </RouterLink>

        <!-- Desktop nav -->
        <nav aria-label="Main Navigation" class="hidden sm:block">
          <ul class="flex items-center gap-4 text-sm text-slate-600">
            <li>
              <RouterLink to="/" exact-active-class="font-medium text-indigo-600" active-class="">Home</RouterLink>
            </li>
            <li>
              <RouterLink to="/about" active-class="font-medium text-indigo-600">About</RouterLink>
            </li>
            <template v-if="hydrated && currentUser">
              <li>
                <RouterLink to="/tasks" active-class="font-medium text-indigo-600">Tasks</RouterLink>
              </li>
              <li>
                <RouterLink to="/library" active-class="font-medium text-indigo-600">Library</RouterLink>
              </li>
              <li v-if="auth.isAdmin">
                <RouterLink to="/admin" active-class="font-medium text-indigo-600">Admin</RouterLink>
              </li>
              <li><span class="text-slate-500">{{ currentUser.email }}</span></li>
              <li>
                <button class="text-slate-600 hover:text-slate-900" @click="logout">Log out</button>
              </li>
            </template>
            <template v-else>
              <li>
                <RouterLink to="/login" active-class="font-medium text-indigo-600">Log in</RouterLink>
              </li>
              <li>
                <RouterLink to="/register" active-class="font-medium text-indigo-600">Register</RouterLink>
              </li>
            </template>
          </ul>
        </nav>

        <!-- Hamburger button (mobile only) -->
        <button
          class="sm:hidden rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          :aria-expanded="menuOpen"
          aria-label="Toggle navigation"
          aria-controls="mobile-menu"
          @click="menuOpen = !menuOpen"
        >
          <svg v-if="menuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <!-- Mobile menu -->
      <nav v-if="menuOpen" id="mobile-menu" aria-label="Mobile Navigation" class="sm:hidden border-t border-slate-200">
        <ul class="flex flex-col gap-1 px-4 py-3 text-sm text-slate-600">
          <li>
            <RouterLink to="/" exact-active-class="font-medium text-indigo-600" active-class="" class="block rounded-md px-2 py-2 hover:bg-slate-50">Home</RouterLink>
          </li>
          <li>
            <RouterLink to="/about" active-class="font-medium text-indigo-600" class="block rounded-md px-2 py-2 hover:bg-slate-50">About</RouterLink>
          </li>
          <template v-if="hydrated && currentUser">
            <li>
              <RouterLink to="/tasks" active-class="font-medium text-indigo-600" class="block rounded-md px-2 py-2 hover:bg-slate-50">Tasks</RouterLink>
            </li>
            <li>
              <RouterLink to="/library" active-class="font-medium text-indigo-600" class="block rounded-md px-2 py-2 hover:bg-slate-50">Library</RouterLink>
            </li>
            <li v-if="auth.isAdmin">
              <RouterLink to="/admin" active-class="font-medium text-indigo-600" class="block rounded-md px-2 py-2 hover:bg-slate-50">Admin</RouterLink>
            </li>
            <li class="mt-2 border-t border-slate-100 pt-2">
              <span class="block px-2 py-1 text-xs text-slate-400">{{ currentUser.email }}</span>
            </li>
            <li>
              <button class="block w-full rounded-md px-2 py-2 text-left hover:bg-slate-50" @click="logout">Log out</button>
            </li>
          </template>
          <template v-else>
            <li>
              <RouterLink to="/login" active-class="font-medium text-indigo-600" class="block rounded-md px-2 py-2 hover:bg-slate-50">Log in</RouterLink>
            </li>
            <li>
              <RouterLink to="/register" active-class="font-medium text-indigo-600" class="block rounded-md px-2 py-2 hover:bg-slate-50">Register</RouterLink>
            </li>
          </template>
        </ul>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
  <ToastHost />
</template>
