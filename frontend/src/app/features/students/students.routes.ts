import { Routes } from '@angular/router';

export const STUDENTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Students',
    loadComponent: () => import('./students-list.page').then((m) => m.StudentsListPage),
  },
  {
    path: ':id',
    title: 'Student profile',
    loadComponent: () => import('./profile/student-profile.page').then((m) => m.StudentProfilePage),
  },
];
