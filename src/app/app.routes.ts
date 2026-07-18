import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { directorGuard } from './core/guards/director.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'teacher',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/teacher-layout/teacher-layout.component').then(m => m.TeacherLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/teacher/dashboard/teacher-dashboard.component').then(
            m => m.TeacherDashboardComponent
          )
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/teacher/profile/teacher-profile.component').then(m => m.TeacherProfileComponent)
      }
    ]
  },
  {
    path: 'director',
    canActivate: [authGuard, directorGuard],
    loadComponent: () =>
      import('./layout/director-layout/director-layout.component').then(m => m.DirectorLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/director/dashboard/director-dashboard.component').then(
            m => m.DirectorDashboardComponent
          )
      },
      {
        path: 'attendance',
        loadComponent: () =>
          import('./features/teacher/dashboard/teacher-dashboard.component').then(
            m => m.TeacherDashboardComponent
          )
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/director/profile/director-profile.component').then(
            m => m.DirectorProfileComponent
          )
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
