import { ISODate, ISODateTime } from './common.model';

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  annualQuota: number;
  paid: boolean;
  carryForward: boolean;
  description: string;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  from: ISODate;
  to: ISODate;
  days: number;
  halfDay: boolean;
  reason: string;
  status: LeaveStatus;
  appliedOn: ISODateTime;
  decidedBy: string | null;
  decidedOn: ISODate | null;
  decisionNote: string;
}

export interface LeaveRequestView extends LeaveRequest {
  employeeName: string;
  department: string;
  leaveTypeName: string;
  decidedByName: string | null;
}

export interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  code: string;
  quota: number;
  used: number;
  pending: number;
  available: number;
}

export interface EmployeeLeaveBalance {
  employeeId: string;
  employeeName: string;
  department: string;
  balances: LeaveBalance[];
}

export interface ApplyLeaveDto {
  employeeId: string;
  leaveTypeId: string;
  from: ISODate;
  to: ISODate;
  halfDay: boolean;
  reason: string;
}

export type LeaveTypeInput = Omit<LeaveType, 'id'>;
