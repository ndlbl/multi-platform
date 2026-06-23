<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "./stores/auth";
import { useCurrentUser } from "./composables/useCurrentUser";
import { queryClient } from "./queryClient";
import GlobalSpinner from "./components/GlobalSpinner.vue";
import ToastHost from "./components/ToastHost.vue";

const auth = useAuthStore();
const router = useRouter();
const userQuery = useCurrentUser();

// data is a Ref inside a plain object — must unwrap explicitly for template use
const currentUser = computed(() => userQuery.data.value ?? null);

const hydrated = ref(false);
onMounted(() => {
  hydrated.value = true;
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
        <RouterLink to="/" class="text-xl font-bold text-slate-900">Task Manager</RouterLink>

        <nav aria-label="Main Navigation">
          <ul class="flex items-center gap-4 text-sm text-slate-600">
            <li>
              <RouterLink to="/" exact-active-class="font-medium text-indigo-600" active-class=""> Home </RouterLink>
            </li>
            <li>
              <RouterLink to="/about" active-class="font-medium text-indigo-600"> About </RouterLink>
            </li>

            <template v-if="hydrated && currentUser">
              <li>
                <RouterLink to="/tasks" active-class="font-medium text-indigo-600"> Tasks </RouterLink>
              </li>
              <li>
                <RouterLink to="/library" active-class="font-medium text-indigo-600"> Library </RouterLink>
              </li>
              <li v-if="auth.isAdmin">
                <RouterLink to="/admin" active-class="font-medium text-indigo-600"> Admin </RouterLink>
              </li>
              <li>
                <span class="text-slate-500">{{ currentUser.email }}</span>
              </li>
              <li>
                <button class="text-slate-600 hover:text-slate-900" @click="logout">Log out</button>
              </li>
            </template>
            <template v-else>
              <li>
                <RouterLink to="/login" active-class="font-medium text-indigo-600"> Log in </RouterLink>
              </li>
              <li>
                <RouterLink to="/register" active-class="font-medium text-indigo-600"> Register </RouterLink>
              </li>
            </template>
          </ul>
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
  <ToastHost />
</template>
