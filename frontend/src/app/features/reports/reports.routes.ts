import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./reports.page').then((m) => m.ReportsPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'admissions' },
      {
        path: 'admissions',
        title: 'Admissions report',
        loadComponent: () => import('./views/admissions-report').then((m) => m.AdmissionsReport),
      },
      {
        path: 'fee-collection',
        title: 'Fee collection report',
        loadComponent: () =>
          import('./views/fee-collection-report').then((m) => m.FeeCollectionReport),
      },
      {
        path: 'pending-fees',
        title: 'Pending fees report',
        loadComponent: () => import('./views/pending-fees-report').then((m) => m.PendingFeesReport),
      },
      {
        path: 'student-attendance',
        title: 'Student attendance report',
        loadComponent: () =>
          import('./views/student-attendance-report').then((m) => m.StudentAttendanceReport),
      },
      {
        path: 'staff-attendance',
        title: 'Staff attendance report',
        loadComponent: () =>
          import('./views/staff-attendance-report').then((m) => m.StaffAttendanceReport),
      },
      {
        path: 'payroll',
        title: 'Payroll summary',
        loadComponent: () => import('./views/payroll-report').then((m) => m.PayrollReport),
      },
      {
        path: 'sales-calls',
        title: 'Sales calls report',
        loadComponent: () => import('./views/sales-calls-report').then((m) => m.SalesCallsReport),
      },
      {
        path: 'mentor-reports',
        title: 'Mentor reports summary',
        loadComponent: () =>
          import('./views/mentor-reports-report').then((m) => m.MentorReportsReport),
      },
    ],
  },
];
