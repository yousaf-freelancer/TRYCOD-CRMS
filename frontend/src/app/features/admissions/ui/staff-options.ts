import { inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Option } from '../../../models';
import { CoursesService } from '../../courses/data-access/courses.service';
import { EmployeesService } from '../../hr/data-access/employees.service';

/** Shared option lists for admissions forms (must be called in an injection context). */
export function admissionsLookups() {
  const courses = inject(CoursesService);
  const employees = inject(EmployeesService);
  return {
    courses: rxResource({
      stream: () =>
        courses.getCourses().pipe(map((list) => list.filter((c) => c.status === 'Active'))),
      defaultValue: [],
    }),
    counsellors: rxResource({
      stream: () =>
        employees
          .getEmployees({ roles: ['Admin', 'Advisor', 'Sales'], status: 'Active' })
          .pipe(
            map((list) =>
              list.map((e): Option => ({ label: `${e.name} · ${e.role}`, value: e.id })),
            ),
          ),
      defaultValue: [],
    }),
  };
}
