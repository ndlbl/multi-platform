import { Routes } from '@angular/router';

import { AdminUserDetailComponent } from './admin/admin-user-detail/admin-user-detail.component';
import { AdminUsersComponent } from './admin/admin-users/admin-users.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { adminGuard, authGuard } from './core/auth.guard';
import { AboutComponent } from './info/about/about.component';
import { HomeComponent } from './info/home/home.component';
import { LibraryListComponent } from './library/library-list/library-list.component';
import { TaskFormComponent } from './tasks/task-form/task-form.component';
import { TaskListComponent } from './tasks/task-list/task-list.component';

export const routes: Routes = [
  // Public, Non authed routes.
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'about', component: AboutComponent },

  // other public routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  //= rarely seen routes can be lazy loaded to reduce package sizes
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./auth/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent),
  },
  {
    path: 'login-otp',
    loadComponent: () =>
      import('./auth/login-with-otp/login-with-otp.component').then((m) => m.LoginWithOtpComponent),
  },

  // Authenticated, data driven routes.
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'tasks', component: TaskListComponent },
      { path: 'tasks/new', component: TaskFormComponent },
      { path: 'tasks/:id/edit', component: TaskFormComponent },
      { path: 'library', component: LibraryListComponent },
    ],
  },

  // Admin routes.
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', component: AdminUsersComponent },
      { path: 'users/:id', component: AdminUserDetailComponent },
    ],
  },

  { path: '**', redirectTo: '' },
];
