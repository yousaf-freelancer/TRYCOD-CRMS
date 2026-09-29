import { Routes } from '@angular/router';
import { roleGuard } from '../../../core/auth/auth.guards';
import { ROUTE_ROLES } from '../../../core/navigation/nav.config';

export const ADMISSIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admissions.page').then((m) => m.AdmissionsPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'leads' },
      {
        path: 'leads',
        title: 'Leads',
        loadComponent: () => import('./leads/leads-tab').then((m) => m.LeadsTab),
      },
      {
        path: 'enquiries',
        title: 'Enquiries',
        loadComponent: () => import('./enquiries/enquiries-tab').then((m) => m.EnquiriesTab),
      },
      {
        path: 'follow-ups',
        title: 'Follow-ups',
        loadComponent: () => import('./follow-ups/follow-ups-tab').then((m) => m.FollowUpsTab),
      },
      {
        path: 'admissions',
        title: 'Admissions',
        data: { roles: ROUTE_ROLES.admissionsOnly },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./admissions-list/admissions-tab').then((m) => m.AdmissionsTab),
      },
    ],
  },
];
