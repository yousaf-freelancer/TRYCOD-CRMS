import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client';
import {
  AttendanceMarkRow,
  DayAttendance,
  ISODate,
  MonthKey,
  MonthlyRegisterRow,
  SaveAttendanceDto,
  StaffAttendanceStatus,
  StaffAttendanceView,
  StaffMonthlySummary,
  TrendPoint,
} from '../../domain/models';

export interface StudentAttendanceSummary {
  present: number;
  late: number;
  absent: number;
  total: number;
  pct: number;
}

export interface MonthlyRegister {
  dates: ISODate[];
  rows: MonthlyRegisterRow[];
}

export interface StaffCorrectionDto {
  employeeId: string;
  date: ISODate;
  status: StaffAttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
}

const EMPTY_SUMMARY: StudentAttendanceSummary = {
  present: 0,
  late: 0,
  absent: 0,
  total: 0,
  pct: 0,
};

/**
 * Student + staff attendance. Device (biometric) records arrive with
 * `source: 'Device'`. Endpoints: `/attendance/students/...`, `/attendance/staff/...`.
 */
@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly api = inject(ApiClient);

  // --------------------------------------------------------- students
  getMarkSheet(batchId: string, date: ISODate): Observable<AttendanceMarkRow[]> {
    return this.api.get<AttendanceMarkRow[]>('attendance/students/sheet', [], { batchId, date });
  }

  /** Saves the batch's attendance; resolves to the number of entries saved. */
  saveAttendance(dto: SaveAttendanceDto): Observable<number> {
    return this.api.post<number>('attendance/students', dto);
  }

  getMonthlyRegister(batchId: string, month: MonthKey): Observable<MonthlyRegister> {
    return this.api.get<MonthlyRegister>(
      'attendance/students/register',
      { dates: [], rows: [] },
      { batchId, month },
    );
  }

  getStudentCalendar(studentId: string, month: MonthKey): Observable<DayAttendance[]> {
    return this.api.get<DayAttendance[]>(`attendance/students/${studentId}/calendar`, [], {
      month,
    });
  }

  getStudentSummary(studentId: string, month?: MonthKey): Observable<StudentAttendanceSummary> {
    return this.api.get<StudentAttendanceSummary>(
      `attendance/students/${studentId}/summary`,
      { ...EMPTY_SUMMARY },
      { month },
    );
  }

  /** Daily attendance % across all batches for the last `days` days. */
  getStudentTrend(days = 30, batchId?: string | null): Observable<TrendPoint[]> {
    return this.api.get<TrendPoint[]>('attendance/students/trend', [], { days, batchId });
  }

  // ------------------------------------------------------------ staff
  getStaffDaily(date: ISODate): Observable<StaffAttendanceView[]> {
    return this.api.get<StaffAttendanceView[]>('attendance/staff/daily', [], { date });
  }

  correctStaffAttendance(dto: StaffCorrectionDto): Observable<StaffAttendanceView> {
    return this.api.put<StaffAttendanceView>('attendance/staff', dto);
  }

  getStaffMonthly(month: MonthKey): Observable<StaffMonthlySummary[]> {
    return this.api.get<StaffMonthlySummary[]>('attendance/staff/monthly', [], { month });
  }

  getStaffCalendar(employeeId: string, month: MonthKey): Observable<StaffAttendanceView[]> {
    return this.api.get<StaffAttendanceView[]>(`attendance/staff/${employeeId}/calendar`, [], {
      month,
    });
  }
}
