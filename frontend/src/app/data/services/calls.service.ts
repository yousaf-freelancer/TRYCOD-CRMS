import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client';
import { CallFilters, CallLogView, CallStats, Employee } from '../../domain/models';

/**
 * Sales call log. Calls are synced from the telephony provider by the
 * backend; the frontend only reads them: `/calls`, `/calls/stats`, `/calls/salespeople`.
 */
@Injectable({ providedIn: 'root' })
export class CallsService {
  private readonly api = inject(ApiClient);

  getSalespeople(): Observable<Employee[]> {
    return this.api.get<Employee[]>('calls/salespeople', []);
  }

  getCalls(filters: CallFilters = {}): Observable<CallLogView[]> {
    return this.api.get<CallLogView[]>('calls', [], { ...filters });
  }

  getStats(filters: CallFilters = {}): Observable<CallStats[]> {
    return this.api.get<CallStats[]>('calls/stats', [], { ...filters });
  }
}
