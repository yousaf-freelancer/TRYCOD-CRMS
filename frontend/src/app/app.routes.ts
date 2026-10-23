import { Routes } from '@angular/router';
import {
  authGuard,
  guestGuard,
  homeRedirect,
  permissionGuard,
  staffGuard,
} from './core/auth/auth.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: homeRedirect },
  {
    path: 'login',
    title: 'Sign in',
    canActivate: [guestGuard],
    loadComponent: () => import('./presentation/features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'portal',
    canActivate: [authGuard, permissionGuard('portal.access')],
    loadComponent: () => import('./presentation/layout/portal-shell').then((m) => m.PortalShell),
    loadChildren: () => import('./presentation/features/portal/portal.routes').then((m) => m.PORTAL_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard, staffGuard],
    loadComponent: () => import('./presentation/layout/shell').then((m) => m.Shell),
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard',
        canActivate: [permissionGuard('dashboard.view')],
        loadComponent: () =>
          import('./presentation/features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'admissions',
        data: { section: 'Admissions' },
        canActivate: [permissionGuard('admissions.view')],
        loadChildren: () =>
          import('./presentation/features/admissions/admissions.routes').then((m) => m.ADMISSIONS_ROUTES),
      },
      {
        path: 'students',
        data: { section: 'Students' },
        canActivate: [permissionGuard('students.view')],
        loadChildren: () =>
          import('./presentation/features/students/students.routes').then((m) => m.STUDENTS_ROUTES),
      },
      {
        path: 'courses',
        data: { section: 'Courses & Batches' },
        canActivate: [permissionGuard('courses.view')],
        loadChildren: () =>
          import('./presentation/features/courses/courses.routes').then((m) => m.COURSES_ROUTES),
      },
      {
        path: 'fees',
        data: { section: 'Fees' },
        canActivate: [permissionGuard('fees.view')],
        loadChildren: () => import('./presentation/features/fees/fees.routes').then((m) => m.FEES_ROUTES),
      },
      {
        path: 'attendance',
        data: { section: 'Attendance' },
        canActivate: [permissionGuard('attendance.student.mark')],
        loadChildren: () =>
          import('./presentation/features/attendance/attendance.routes').then((m) => m.ATTENDANCE_ROUTES),
      },
      {
        path: 'hr',
        data: { section: 'HR' },
        canActivate: [permissionGuard('hr.view')],
        loadChildren: () => import('./presentation/features/hr/hr.routes').then((m) => m.HR_ROUTES),
      },
      {
        path: 'me',
        data: { section: 'My Workspace' },
        canActivate: [permissionGuard('self.access')],
        loadChildren: () =>
          import('./presentation/features/hr/self-service/self-service.routes').then(
            (m) => m.SELF_SERVICE_ROUTES,
          ),
      },
      {
        path: 'mentor-reports',
        data: { section: 'Mentor Reports' },
        canActivate: [permissionGuard('mentor_reports.view')],
        loadChildren: () =>
          import('./presentation/features/mentor-reports/mentor-reports.routes').then(
            (m) => m.MENTOR_REPORTS_ROUTES,
          ),
      },
      {
        path: 'calls',
        title: 'Sales Calls',
        canActivate: [permissionGuard('calls.view')],
        loadComponent: () => import('./presentation/features/calls/calls.page').then((m) => m.CallsPage),
      },
      {
        path: 'reports',
        data: { section: 'Reports' },
        canActivate: [permissionGuard('reports.view')],
        loadChildren: () =>
          import('./presentation/features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      },
      {
        path: 'notifications',
        title: 'Notifications',
        loadComponent: () =>
          import('./presentation/features/notifications/notifications.page').then((m) => m.NotificationsPage),
      },
      {
        path: 'settings',
        data: { section: 'Settings' },
        loadChildren: () =>
          import('./presentation/features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },
      {
        path: 'forbidden',
        title: 'Access denied',
        loadComponent: () => import('./presentation/layout/status-pages').then((m) => m.ForbiddenPage),
      },
      {
        path: '**',
        title: 'Page not found',
        loadComponent: () => import('./presentation/layout/status-pages').then((m) => m.NotFoundPage),
      },
    ],
  },
];
