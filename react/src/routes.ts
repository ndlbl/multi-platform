import { index, layout, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  // Public marketing pages — ssg/ssr
  index('routes/HomePage.tsx'),
  route('about', 'routes/AboutPage.tsx'),

  // Public
  route('login', 'routes/LoginPage.tsx'),
  route('register', 'routes/RegisterPage.tsx'),
  route('verify-email', 'routes/VerifyEmailPage.tsx'),
  route('login-otp', 'routes/LoginWithOtpPage.tsx'),

  // Authenticated
  layout('auth/AuthedLayout.tsx', [
    route('library', 'routes/LibraryPage.tsx'),
    route('tasks', 'routes/TaskListPage.tsx'),
    // Same module on multiple paths? they need unique ids
    route('tasks/new', 'routes/TaskFormPage.tsx', { id: 'task-new' }),
    route('tasks/:id/edit', 'routes/TaskFormPage.tsx', { id: 'task-edit' }),
  ]),

  // Admin, stacked auth and admin guards
  route('admin', 'auth/AdminLayout.tsx', [
    index('routes/AdminUsersPage.tsx'),
    route('users/:id', 'routes/AdminUserDetailPage.tsx'),
  ]),

  route('*', 'routes/NotFoundPage.tsx'),
] satisfies RouteConfig;
