import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/auth/auth.guards';
import { AuthService } from '../../../core/auth/auth.service';

const admin = { canActivate: [permissionGuard('settings.manage')] };

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings.page').then((m) => m.SettingsPage),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: () =>
          inject(AuthService).hasPermission('settings.manage') ? 'institute' : 'account',
      },
      {
        path: 'account',
        title: 'My account',
        loadComponent: () => import('./sections/account-settings').then((m) => m.AccountSettings),
      },
      {
        path: 'institute',
        title: 'Institute profile',
        ...admin,
        loadComponent: () =>
          import('./sections/institute-settings').then((m) => m.InstituteSettings),
      },
      {
        path: 'academic-year',
        title: 'Academic year',
        ...admin,
        loadComponent: () =>
          import('./sections/academic-year-settings').then((m) => m.AcademicYearSettings),
      },
      {
        path: 'fees',
        title: 'Fee settings',
        ...admin,
        loadComponent: () => import('./sections/fee-settings').then((m) => m.FeeSettingsSection),
      },
      {
        path: 'attendance',
        title: 'Attendance rules',
        ...admin,
        loadComponent: () =>
          import('./sections/attendance-settings').then((m) => m.AttendanceSettings),
      },
      {
        path: 'leave-types',
        title: 'Leave types',
        ...admin,
        loadComponent: () =>
          import('./sections/leave-type-settings').then((m) => m.LeaveTypeSettings),
      },
      {
        path: 'roles',
        title: 'Roles & permissions',
        canActivate: [permissionGuard('users.manage')],
        loadComponent: () => import('./sections/roles-settings').then((m) => m.RolesSettings),
      },
      {
        path: 'notifications',
        title: 'Notification preferences',
        ...admin,
        loadComponent: () =>
          import('./sections/notification-settings').then((m) => m.NotificationSettings),
      },
    ],
  },
];
