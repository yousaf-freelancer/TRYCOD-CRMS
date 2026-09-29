import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { roleGuard } from '../../../core/auth/auth.guards';
import { AuthService } from '../../../core/auth/auth.service';

export const COURSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./courses.page').then((m) => m.CoursesPage),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: () => (inject(AuthService).role() === 'Mentor' ? 'batches' : 'catalog'),
      },
      {
        path: 'catalog',
        title: 'Courses',
        data: { roles: ['Admin', 'Advisor'] },
        canActivate: [roleGuard],
        loadComponent: () => import('./courses-list').then((m) => m.CoursesList),
      },
      {
        path: 'batches',
        title: 'Batches',
        loadComponent: () => import('./batches-list').then((m) => m.BatchesList),
      },
    ],
  },
];
