import { ISODate } from './common.model';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';
export type AttendanceSource = 'Manual' | 'Device';

export interface StudentAttendance {
  id: string;
  studentId: string;
  batchId: string;
  date: ISODate;
  status: AttendanceStatus;
  source: AttendanceSource;
  markedBy: string;
}

/** One row in the "mark attendance" grid. */
export interface AttendanceMarkRow {
  studentId: string;
  studentName: string;
  phone: string;
  status: AttendanceStatus | null;
  source: AttendanceSource | null;
  attendancePct: number;
}

export interface SaveAttendanceDto {
  batchId: string;
  date: ISODate;
  markedBy: string;
  entries: { studentId: string; status: AttendanceStatus }[];
}

export interface MonthlyRegisterRow {
  studentId: string;
  studentName: string;
  days: Record<string, AttendanceStatus | null>;
  present: number;
  absent: number;
  late: number;
  pct: number;
}

export type StaffAttendanceStatus = 'Present' | 'Absent' | 'Late' | 'On Leave' | 'Half Day';

export interface StaffAttendance {
  id: string;
  employeeId: string;
  date: ISODate;
  checkIn: string | null;
  checkOut: string | null;
  status: StaffAttendanceStatus;
  source: AttendanceSource;
}

export interface StaffAttendanceView extends StaffAttendance {
  employeeName: string;
  designation: string;
  department: string;
  workingMinutes: number;
}

export interface StaffMonthlySummary {
  employeeId: string;
  employeeName: string;
  department: string;
  workingDays: number;
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  onLeave: number;
  avgMinutes: number;
  pct: number;
}

export interface DayAttendance {
  date: ISODate;
  status: AttendanceStatus | StaffAttendanceStatus;
}
