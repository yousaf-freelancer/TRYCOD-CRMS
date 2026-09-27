import { Routes } from '@angular/router';

export const PORTAL_ROUTES: Routes = [
  {
    path: '',
    title: 'Home',
    loadComponent: () => import('./portal-home.page').then((m) => m.PortalHomePage),
  },
  {
    path: 'attendance',
    title: 'My attendance',
    loadComponent: () => import('./portal-attendance.page').then((m) => m.PortalAttendancePage),
  },
  {
    path: 'fees',
    title: 'My fees',
    loadComponent: () => import('./portal-fees.page').then((m) => m.PortalFeesPage),
  },
  {
    path: 'receipt/:id',
    title: 'Fee receipt',
    loadComponent: () => import('../fees/receipt/receipt.page').then((m) => m.ReceiptPage),
  },
  {
    path: 'reports',
    title: 'Mentor reports',
    loadComponent: () => import('./portal-reports.page').then((m) => m.PortalReportsPage),
  },
  {
    path: 'notifications',
    title: 'Notifications',
    loadComponent: () =>
      import('../notifications/notifications.page').then((m) => m.NotificationsPage),
  },
  {
    path: 'profile',
    title: 'My profile',
    loadComponent: () => import('./portal-profile.page').then((m) => m.PortalProfilePage),
  },
  { path: '**', redirectTo: '' },
];
