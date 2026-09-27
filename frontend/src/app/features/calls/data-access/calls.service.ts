import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockDb } from '../../../core/mock/mock-db';
import { mockCompute } from '../../../core/mock/mock-response';
import { CallFilters, CallLog, CallLogView, CallStats, Employee } from '../../../models';
import { inRange } from '../../../shared/utils/date.util';

/**
 * Sales call log. Calls will be synced from the telephony provider by the
 * backend; the frontend only reads them. Later: `GET /api/calls`, `GET /api/calls/stats`.
 */
@Injectable({ providedIn: 'root' })
export class CallsService {
  private readonly db = inject(MockDb);

  getSalespeople(): Observable<Employee[]> {
    return mockCompute(() => {
      const ids = new Set(this.db.calls.map((c) => c.salespersonId));
      return this.db.employees.filter((e) => ids.has(e.id));
    }, 100);
  }

  getCalls(filters: CallFilters = {}): Observable<CallLogView[]> {
    return mockCompute(() =>
      this.filter(filters).map((c) => ({
        ...c,
        salespersonName: this.db.employeeName(c.salespersonId),
      })),
    );
  }

  getStats(filters: CallFilters = {}): Observable<CallStats[]> {
    return mockCompute(() => {
      const calls = this.filter({ ...filters, salespersonId: filters.salespersonId });
      const bySales = new Map<string, CallLog[]>();
      for (const c of calls)
        bySales.set(c.salespersonId, [...(bySales.get(c.salespersonId) ?? []), c]);
      return [...bySales.entries()]
        .map(([id, list]) => statsFor(id, this.db.employeeName(id), list))
        .sort((a, b) => b.total - a.total);
    });
  }

  private filter(f: CallFilters): CallLog[] {
    return this.db.calls.filter(
      (c) =>
        inRange(c.at, f.from, f.to) &&
        (!f.salespersonId || c.salespersonId === f.salespersonId) &&
        (!f.direction || c.direction === f.direction) &&
        (!f.status || c.status === f.status),
    );
  }
}

export function statsFor(id: string, name: string, list: CallLog[]): CallStats {
  const answered = list.filter((c) => c.status === 'Answered');
  const talk = answered.reduce((s, c) => s + c.durationSec, 0);
  return {
    salespersonId: id,
    salespersonName: name,
    total: list.length,
    answered: answered.length,
    missed: list.length - answered.length,
    incoming: list.filter((c) => c.direction === 'Incoming').length,
    outgoing: list.filter((c) => c.direction === 'Outgoing').length,
    avgDurationSec: answered.length ? Math.round(talk / answered.length) : 0,
    talkTimeSec: talk,
  };
}
