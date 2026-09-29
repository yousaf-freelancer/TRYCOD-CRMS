import { Routes } from '@angular/router';
import {
  guestGuard,
  homeRedirect,
  roleGuard,
  staffGuard,
  studentGuard,
} from './core/auth/auth.guards';
import { ROUTE_ROLES } from './core/navigation/nav.config';

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
    canActivate: [studentGuard],
    loadComponent: () => import('./presentation/layout/portal-shell').then((m) => m.PortalShell),
    loadChildren: () => import('./presentation/features/portal/portal.routes').then((m) => m.PORTAL_ROUTES),
  },
  {
    path: '',
    canActivate: [staffGuard],
    loadComponent: () => import('./presentation/layout/shell').then((m) => m.Shell),
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () =>
          import('./presentation/features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'admissions',
        data: { roles: ROUTE_ROLES.admissions, section: 'Admissions' },
        canActivate: [roleGuard],
        loadChildren: () =>
          import('./presentation/features/admissions/admissions.routes').then((m) => m.ADMISSIONS_ROUTES),
      },
      {
        path: 'students',
        data: { roles: ROUTE_ROLES.students, section: 'Students' },
        canActivate: [roleGuard],
        loadChildren: () =>
          import('./presentation/features/students/students.routes').then((m) => m.STUDENTS_ROUTES),
      },
      {
        path: 'courses',
        data: { roles: ROUTE_ROLES.courses, section: 'Courses & Batches' },
        canActivate: [roleGuard],
        loadChildren: () =>
          import('./presentation/features/courses/courses.routes').then((m) => m.COURSES_ROUTES),
      },
      {
        path: 'fees',
        data: { roles: ROUTE_ROLES.fees, section: 'Fees' },
        canActivate: [roleGuard],
        loadChildren: () => import('./presentation/features/fees/fees.routes').then((m) => m.FEES_ROUTES),
      },
      {
        path: 'attendance',
        data: { roles: ROUTE_ROLES.attendance, section: 'Attendance' },
        canActivate: [roleGuard],
        loadChildren: () =>
          import('./presentation/features/attendance/attendance.routes').then((m) => m.ATTENDANCE_ROUTES),
      },
      {
        path: 'hr',
        data: { roles: ROUTE_ROLES.admin, section: 'HR' },
        canActivate: [roleGuard],
        loadChildren: () => import('./presentation/features/hr/hr.routes').then((m) => m.HR_ROUTES),
      },
      {
        path: 'me',
        data: { roles: ROUTE_ROLES.staff, section: 'My Workspace' },
        canActivate: [roleGuard],
        loadChildren: () =>
          import('./presentation/features/hr/self-service/self-service.routes').then(
            (m) => m.SELF_SERVICE_ROUTES,
          ),
      },
      {
        path: 'mentor-reports',
        data: { roles: ROUTE_ROLES.mentorReports, section: 'Mentor Reports' },
        canActivate: [roleGuard],
        loadChildren: () =>
          import('./presentation/features/mentor-reports/mentor-reports.routes').then(
            (m) => m.MENTOR_REPORTS_ROUTES,
          ),
      },
      {
        path: 'calls',
        title: 'Sales Calls',
        data: { roles: ROUTE_ROLES.calls },
        canActivate: [roleGuard],
        loadComponent: () => import('./presentation/features/calls/calls.page').then((m) => m.CallsPage),
      },
      {
        path: 'reports',
        data: { roles: ROUTE_ROLES.admin, section: 'Reports' },
        canActivate: [roleGuard],
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
