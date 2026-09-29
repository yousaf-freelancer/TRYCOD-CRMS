import { Routes } from '@angular/router';

export const MENTOR_REPORTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Mentor reports',
    loadComponent: () => import('./reports-list.page').then((m) => m.MentorReportsListPage),
  },
  {
    path: 'write',
    title: 'Write weekly reports',
    loadComponent: () => import('./write-reports.page').then((m) => m.WriteReportsPage),
  },
];
