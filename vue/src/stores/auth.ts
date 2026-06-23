import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { User } from "../api/auth";

// handle auth/admin JWT tokens to storage

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(typeof localStorage !== "undefined" ? localStorage.getItem("auth-token") : null);
  const currentUser = ref<User | null>(null);

  const isLoggedIn = computed(() => currentUser.value !== null);
  const isAdmin = computed(() => currentUser.value?.role === "admin");

  function applyAuth(data: { user: User; token: string }) {
    localStorage.setItem("auth-token", data.token);
    token.value = data.token;
    currentUser.value = data.user;
  }

  function logout() {
    localStorage.removeItem("auth-token");
    token.value = null;
    currentUser.value = null;
  }

  function setUser(user: User) {
    currentUser.value = user;
  }

  return { token, currentUser, isLoggedIn, isAdmin, applyAuth, logout, setUser };
});
