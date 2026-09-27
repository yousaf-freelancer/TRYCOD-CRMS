import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Role } from '../../models';
import { AuthService } from '../auth/auth.service';
import { MockDb } from '../mock/mock-db';
import { mockCompute } from '../mock/mock-response';
import { navForRole } from '../navigation/nav.config';

export interface SearchResult {
  group: 'Pages' | 'Students' | 'Leads' | 'Employees';
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

const MAX_PER_GROUP = 5;

/** Global search across records the current role may see. Swap for `GET /api/search?q=`. */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly db = inject(MockDb);
  private readonly auth = inject(AuthService);

  search(query: string): Observable<SearchResult[]> {
    return mockCompute(() => this.run(query.trim().toLowerCase(), this.auth.role()), 120);
  }

  private run(q: string, role: Role | null): SearchResult[] {
    if (!q || !role) return [];
    const has = (...values: string[]) => values.some((v) => v.toLowerCase().includes(q));
    const results: SearchResult[] = [];

    navForRole(role)
      .flatMap((s) => s.items)
      .filter((i) => has(i.label))
      .slice(0, MAX_PER_GROUP)
      .forEach((i) =>
        results.push({
          group: 'Pages',
          id: i.route,
          title: i.label,
          subtitle: i.route,
          icon: i.icon,
          route: i.route,
        }),
      );

    if (role === 'Admin' || role === 'Advisor' || role === 'Mentor') {
      this.db.students
        .filter((s) => has(s.name, s.id, s.phone, s.email))
        .slice(0, MAX_PER_GROUP)
        .forEach((s) =>
          results.push({
            group: 'Students',
            id: s.id,
            title: s.name,
            subtitle: `${s.id} · ${this.db.batchCode(s.batchId)}`,
            icon: 'graduation-cap',
            route: `/students/${s.id}`,
          }),
        );
    }

    if (role === 'Admin' || role === 'Advisor' || role === 'Sales') {
      this.db.leads
        .filter((l) => has(l.name, l.id, l.phone))
        .slice(0, MAX_PER_GROUP)
        .forEach((l) =>
          results.push({
            group: 'Leads',
            id: l.id,
            title: l.name,
            subtitle: `${l.id} · ${this.db.courseName(l.courseId)}`,
            icon: 'user-plus',
            route: '/admissions/leads',
          }),
        );
    }

    if (role === 'Admin') {
      this.db.employees
        .filter((e) => has(e.name, e.id, e.designation))
        .slice(0, MAX_PER_GROUP)
        .forEach((e) =>
          results.push({
            group: 'Employees',
            id: e.id,
            title: e.name,
            subtitle: `${e.id} · ${e.designation}`,
            icon: 'id-card',
            route: `/hr/employees/${e.id}`,
          }),
        );
    }
    return results;
  }
}
