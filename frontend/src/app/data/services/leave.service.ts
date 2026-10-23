import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client';
import {
  ApplyLeaveDto,
  EmployeeLeaveBalance,
  LeaveBalance,
  LeaveRequestView,
  LeaveStatus,
  LeaveType,
  LeaveTypeInput,
} from '../../domain/models';

export interface LeaveFilters {
  employeeId?: string | null;
  status?: LeaveStatus | null;
}

/** Leave management: `/leave/types`, `/leave/requests`, `/leave/balances`. */
@Injectable({ providedIn: 'root' })
export class LeaveService {
  private readonly api = inject(ApiClient);

  getLeaveTypes(): Observable<LeaveType[]> {
    return this.api.get<LeaveType[]>('leave/types', []);
  }

  saveLeaveType(input: LeaveTypeInput, id?: string): Observable<LeaveType> {
    return id
      ? this.api.patch<LeaveType>(`leave/types/${id}`, input)
      : this.api.post<LeaveType>('leave/types', input);
  }

  deleteLeaveType(id: string): Observable<void> {
    return this.api.delete(`leave/types/${id}`);
  }

  getRequests(filters: LeaveFilters = {}): Observable<LeaveRequestView[]> {
    return this.api.get<LeaveRequestView[]>('leave/requests', [], { ...filters });
  }

  decide(
    id: string,
    status: 'Approved' | 'Rejected',
    decidedBy: string,
    note = '',
  ): Observable<LeaveRequestView> {
    return this.api.post<LeaveRequestView>(`leave/requests/${id}/decision`, {
      status,
      decidedBy,
      note,
    });
  }

  cancel(id: string): Observable<LeaveRequestView> {
    return this.api.post<LeaveRequestView>(`leave/requests/${id}/cancel`);
  }

  apply(dto: ApplyLeaveDto): Observable<LeaveRequestView> {
    return this.api.post<LeaveRequestView>('leave/requests', dto);
  }

  getBalances(employeeId: string): Observable<LeaveBalance[]> {
    return this.api.get<LeaveBalance[]>(`leave/balances/${employeeId}`, []);
  }

  getAllBalances(): Observable<EmployeeLeaveBalance[]> {
    return this.api.get<EmployeeLeaveBalance[]>('leave/balances', []);
  }
}
