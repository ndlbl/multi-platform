import './style.css';

import { createPinia } from 'pinia';
import { ViteSSG } from 'vite-ssg';
import { VueQueryPlugin } from '@tanstack/vue-query';

import App from './App.vue';
import { authApi } from './api/auth';
import { queryClient } from './queryClient';
import { routes } from './router/index';
import { useAuthStore } from './stores/auth';

export const createApp = ViteSSG(
  App,
  { routes },
  async ({ app, router, isClient }) => {
    const pinia = createPinia();
    app.use(pinia);
    app.use(VueQueryPlugin, { queryClient });

    router.beforeEach((to) => {
      const auth = useAuthStore();
      if (to.meta.requiresAuth && !auth.isLoggedIn) {
        return { path: '/login', query: { returnUrl: to.fullPath } };
      }
      if (to.meta.requiresAdmin && !auth.isAdmin) {
        return { path: '/tasks' };
      }
    });

    // Auth bootstrap only runs in the browser — no localStorage during SSG
    if (isClient) {
      const auth = useAuthStore();
      if (auth.token) {
        try {
          const user = await authApi.me();
          auth.setUser(user);
        } catch {
          auth.logout();
        }
      }
    }
  },
);
