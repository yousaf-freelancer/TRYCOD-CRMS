import { Routes } from '@angular/router';

export const HR_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'employees' },
  {
    path: 'employees',
    title: 'Employees',
    loadComponent: () => import('./employees/employees.page').then((m) => m.EmployeesPage),
  },
  {
    path: 'employees/:id',
    title: 'Employee profile',
    loadComponent: () =>
      import('./employees/employee-profile.page').then((m) => m.EmployeeProfilePage),
  },
  {
    path: 'leave',
    title: 'Leave management',
    loadComponent: () => import('./leave/leave.page').then((m) => m.LeavePage),
  },
  {
    path: 'payroll',
    title: 'Payroll',
    loadComponent: () => import('./payroll/payroll.page').then((m) => m.PayrollPage),
  },
  {
    path: 'payslip/:employeeId/:month',
    title: 'Payslip',
    loadComponent: () => import('./payroll/payslip.page').then((m) => m.PayslipPage),
  },
];
