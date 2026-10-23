import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiClient } from '../http/api-client';
import { AuthService } from '../auth/auth.service';
import { navFor } from '../navigation/nav.config';

export interface SearchResult {
  group: 'Pages' | 'Students' | 'Leads' | 'Employees';
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

const MAX_PER_GROUP = 5;

/**
 * Global search: pages the user can open (from the navigation) plus records
 * from `GET /search?q=`, which the API scopes to the user's permissions.
 */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly api = inject(ApiClient);
  private readonly auth = inject(AuthService);

  search(query: string): Observable<SearchResult[]> {
    const q = query.trim();
    if (!q || !this.auth.isAuthenticated()) return of([]);
    const pages = this.pages(q.toLowerCase());
    return this.api
      .get<SearchResult[]>('search', [], { q })
      .pipe(map((records) => [...pages, ...records]));
  }

  private pages(q: string): SearchResult[] {
    return navFor((p) => this.auth.hasPermission(p), this.auth.role())
      .flatMap((s) => s.items)
      .filter((i) => i.label.toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP)
      .map((i): SearchResult => ({
        group: 'Pages',
        id: i.route,
        title: i.label,
        subtitle: i.route,
        icon: i.icon,
        route: i.route,
      }));
  }
}
