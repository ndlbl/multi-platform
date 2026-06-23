import type { RouteRecordRaw } from 'vue-router';

// vite-ssg creates the router from this array — no createRouter() call here.
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../views/HomePage.vue'),
  },
  {
    path: '/about',
    component: () => import('../views/AboutPage.vue'),
  },
  {
    path: '/login',
    component: () => import('../views/auth/LoginPage.vue'),
  },
  {
    path: '/register',
    component: () => import('../views/auth/RegisterPage.vue'),
  },
  {
    path: '/verify-email',
    component: () => import('../views/auth/VerifyEmailPage.vue'),
  },
  {
    path: '/login-otp',
    component: () => import('../views/auth/LoginWithOtpPage.vue'),
  },
  {
    path: '/',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'tasks',
        component: () => import('../views/tasks/TaskListPage.vue'),
      },
      {
        path: 'tasks/new',
        component: () => import('../views/tasks/TaskFormPage.vue'),
      },
      {
        path: 'tasks/:id/edit',
        component: () => import('../views/tasks/TaskFormPage.vue'),
      },
      {
        path: 'library',
        component: () => import('../views/library/LibraryPage.vue'),
      },
    ],
  },
  {
    path: '/admin',
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        component: () => import('../views/admin/AdminUsersPage.vue'),
      },
      {
        path: 'users/:id',
        component: () => import('../views/admin/AdminUserDetailPage.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('../views/NotFoundPage.vue'),
  },
];
