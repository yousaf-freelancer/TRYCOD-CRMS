import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { leaveBalances } from '../../../core/mock/derive';
import { MockDb } from '../../../core/mock/mock-db';
import { mockCompute, mockError } from '../../../core/mock/mock-response';
import { countLeaveDays } from '../../../mock-data';
import {
  ApplyLeaveDto,
  EmployeeLeaveBalance,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestView,
  LeaveStatus,
  LeaveType,
  LeaveTypeInput,
} from '../../../models';
import { hmFromMinutes, nowMinutes, todayIso } from '../../../shared/utils/date.util';

export interface LeaveFilters {
  employeeId?: string | null;
  status?: LeaveStatus | null;
}

/** Leave management. Later: `/api/leave/types`, `/api/leave/requests`, `/api/leave/balances`. */
@Injectable({ providedIn: 'root' })
export class LeaveService {
  private readonly db = inject(MockDb);

  getLeaveTypes(): Observable<LeaveType[]> {
    return mockCompute(() => [...this.db.leaveTypes], 150);
  }

  saveLeaveType(input: LeaveTypeInput, id?: string): Observable<LeaveType> {
    return mockCompute(() => {
      if (id) {
        const type = this.db.leaveTypes.find((t) => t.id === id)!;
        Object.assign(type, input);
        return type;
      }
      const type: LeaveType = { ...input, id: `LT-${input.code.toUpperCase()}` };
      this.db.leaveTypes.push(type);
      return type;
    });
  }

  deleteLeaveType(id: string): Observable<void> {
    if (this.db.leaveRequests.some((r) => r.leaveTypeId === id)) {
      return mockError('Leave requests exist for this type, so it cannot be deleted.');
    }
    return mockCompute(() => {
      this.db.leaveTypes.splice(
        this.db.leaveTypes.findIndex((t) => t.id === id),
        1,
      );
    });
  }

  getRequests(filters: LeaveFilters = {}): Observable<LeaveRequestView[]> {
    return mockCompute(() =>
      this.db.leaveRequests
        .filter(
          (r) =>
            (!filters.employeeId || r.employeeId === filters.employeeId) &&
            (!filters.status || r.status === filters.status),
        )
        .sort((a, b) => b.appliedOn.localeCompare(a.appliedOn))
        .map((r) => this.toView(r)),
    );
  }

  decide(
    id: string,
    status: 'Approved' | 'Rejected',
    decidedBy: string,
    note = '',
  ): Observable<LeaveRequestView> {
    return mockCompute(() => {
      const request = this.db.leaveRequests.find((r) => r.id === id)!;
      Object.assign(request, { status, decidedBy, decidedOn: todayIso(), decisionNote: note });
      if (status === 'Approved') this.markOnLeave(request);
      return this.toView(request);
    });
  }

  cancel(id: string): Observable<LeaveRequestView> {
    return mockCompute(() => {
      const request = this.db.leaveRequests.find((r) => r.id === id)!;
      request.status = 'Cancelled';
      return this.toView(request);
    });
  }

  apply(dto: ApplyLeaveDto): Observable<LeaveRequestView> {
    const days = countLeaveDays(dto.from, dto.to, dto.halfDay);
    const type = this.db.leaveTypes.find((t) => t.id === dto.leaveTypeId);
    const balance = leaveBalances(this.db, dto.employeeId).find(
      (b) => b.leaveTypeId === dto.leaveTypeId,
    );
    if (type?.annualQuota && balance && days > balance.available) {
      return mockError(`Only ${balance.available} day(s) of ${type.name} available.`);
    }
    return mockCompute(() => {
      const request: LeaveRequest = {
        ...dto,
        id: this.db.nextId('LV', this.db.leaveRequests),
        days,
        status: 'Pending',
        appliedOn: `${todayIso()}T${hmFromMinutes(nowMinutes())}:00`,
        decidedBy: null,
        decidedOn: null,
        decisionNote: '',
      };
      this.db.leaveRequests.unshift(request);
      return this.toView(request);
    });
  }

  getBalances(employeeId: string): Observable<LeaveBalance[]> {
    return mockCompute(() => leaveBalances(this.db, employeeId));
  }

  getAllBalances(): Observable<EmployeeLeaveBalance[]> {
    return mockCompute(() =>
      this.db.employees
        .filter((e) => e.status === 'Active')
        .map((e) => ({
          employeeId: e.id,
          employeeName: e.name,
          department: e.department,
          balances: leaveBalances(this.db, e.id),
        })),
    );
  }

  private markOnLeave(request: LeaveRequest): void {
    for (const record of this.db.staffAttendance) {
      if (
        record.employeeId === request.employeeId &&
        record.date >= request.from &&
        record.date <= request.to
      ) {
        Object.assign(record, {
          status: request.halfDay ? 'Half Day' : 'On Leave',
          source: 'Manual',
        });
        if (!request.halfDay) Object.assign(record, { checkIn: null, checkOut: null });
      }
    }
  }

  private toView(r: LeaveRequest): LeaveRequestView {
    const emp = this.db.employee(r.employeeId);
    return {
      ...r,
      employeeName: emp?.name ?? '—',
      department: emp?.department ?? '',
      leaveTypeName: this.db.leaveTypes.find((t) => t.id === r.leaveTypeId)?.name ?? '—',
      decidedByName: r.decidedBy ? this.db.employeeName(r.decidedBy) : null,
    };
  }
}
