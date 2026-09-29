import { Routes } from '@angular/router';
import { roleGuard } from '../../../core/auth/auth.guards';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./attendance.page').then((m) => m.AttendancePage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'mark' },
      {
        path: 'mark',
        title: 'Mark attendance',
        loadComponent: () => import('./mark/mark-attendance').then((m) => m.MarkAttendance),
      },
      {
        path: 'register',
        title: 'Monthly register',
        loadComponent: () =>
          import('./register/monthly-register').then((m) => m.MonthlyRegisterView),
      },
      {
        path: 'staff',
        title: 'Staff attendance',
        data: { roles: ['Admin'] },
        canActivate: [roleGuard],
        loadComponent: () => import('./staff/staff-attendance').then((m) => m.StaffAttendancePage),
      },
    ],
  },
];
