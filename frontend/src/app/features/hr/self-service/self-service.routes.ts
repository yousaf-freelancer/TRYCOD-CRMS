import { Routes } from '@angular/router';

export const SELF_SERVICE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'attendance' },
  {
    path: 'attendance',
    title: 'My attendance',
    loadComponent: () => import('./my-attendance.page').then((m) => m.MyAttendancePage),
  },
  {
    path: 'leave',
    title: 'My leave',
    loadComponent: () => import('./my-leave.page').then((m) => m.MyLeavePage),
  },
  {
    path: 'payslips',
    title: 'My payslips',
    loadComponent: () => import('./my-payslips.page').then((m) => m.MyPayslipsPage),
  },
  {
    path: 'payslips/:month',
    title: 'Payslip',
    loadComponent: () => import('../payroll/payslip.page').then((m) => m.PayslipPage),
  },
];
