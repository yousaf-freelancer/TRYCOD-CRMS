import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  staffAttendanceView,
  studentAttendanceIndex,
  workingMinutes,
} from '../../../core/mock/derive';
import { MockDb } from '../../../core/mock/mock-db';
import { mockCompute } from '../../../core/mock/mock-response';
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
} from '../../../models';
import {
  addDays,
  formatDayMonth,
  isSunday,
  monthDates,
  todayIso,
} from '../../../shared/utils/date.util';
import { pct } from '../../../shared/utils/format.util';

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

/**
 * Student + staff attendance. Device (biometric) records arrive with
 * `source: 'Device'` once integration is built.
 * Later: `/api/attendance/students`, `/api/attendance/staff`.
 */
@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly db = inject(MockDb);

  // --------------------------------------------------------- students
  getMarkSheet(batchId: string, date: ISODate): Observable<AttendanceMarkRow[]> {
    return mockCompute(() => {
      const existing = new Map(
        this.db.studentAttendance
          .filter((r) => r.batchId === batchId && r.date === date)
          .map((r) => [r.studentId, r]),
      );
      const index = studentAttendanceIndex(this.db);
      return this.db.students
        .filter((s) => s.batchId === batchId && s.status === 'Active')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({
          studentId: s.id,
          studentName: s.name,
          phone: s.phone,
          status: existing.get(s.id)?.status ?? null,
          source: existing.get(s.id)?.source ?? null,
          attendancePct: index.get(s.id)?.pct ?? 0,
        }));
    });
  }

  saveAttendance(dto: SaveAttendanceDto): Observable<number> {
    return mockCompute(() => {
      for (const entry of dto.entries) {
        const record = this.db.studentAttendance.find(
          (r) =>
            r.batchId === dto.batchId && r.date === dto.date && r.studentId === entry.studentId,
        );
        if (record) {
          record.status = entry.status;
          record.source = 'Manual';
          record.markedBy = dto.markedBy;
        } else {
          this.db.studentAttendance.push({
            id: this.db.nextId('SA', this.db.studentAttendance),
            studentId: entry.studentId,
            batchId: dto.batchId,
            date: dto.date,
            status: entry.status,
            source: 'Manual',
            markedBy: dto.markedBy,
          });
        }
      }
      return dto.entries.length;
    }, 500);
  }

  getMonthlyRegister(batchId: string, month: MonthKey): Observable<MonthlyRegister> {
    return mockCompute(() => {
      const today = todayIso();
      const dates = monthDates(month).filter((d) => !isSunday(d) && d <= today);
      const records = this.db.studentAttendance.filter(
        (r) => r.batchId === batchId && r.date.startsWith(month),
      );
      const rows = this.db.students
        .filter((s) => s.batchId === batchId && s.status !== 'Dropped')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => {
          const mine = records.filter((r) => r.studentId === s.id);
          const days: MonthlyRegisterRow['days'] = {};
          for (const d of dates) days[d] = mine.find((r) => r.date === d)?.status ?? null;
          const present = mine.filter((r) => r.status === 'Present').length;
          const late = mine.filter((r) => r.status === 'Late').length;
          const absent = mine.filter((r) => r.status === 'Absent').length;
          return {
            studentId: s.id,
            studentName: s.name,
            days,
            present,
            late,
            absent,
            pct: pct(present + late, mine.length),
          };
        });
      return { dates, rows };
    });
  }

  getStudentCalendar(studentId: string, month: MonthKey): Observable<DayAttendance[]> {
    return mockCompute(() =>
      this.db.studentAttendance
        .filter((r) => r.studentId === studentId && r.date.startsWith(month))
        .map((r) => ({ date: r.date, status: r.status })),
    );
  }

  getStudentSummary(studentId: string, month?: MonthKey): Observable<StudentAttendanceSummary> {
    return mockCompute(() => {
      const records = this.db.studentAttendance.filter(
        (r) => r.studentId === studentId && (!month || r.date.startsWith(month)),
      );
      const present = records.filter((r) => r.status === 'Present').length;
      const late = records.filter((r) => r.status === 'Late').length;
      return {
        present,
        late,
        absent: records.length - present - late,
        total: records.length,
        pct: pct(present + late, records.length),
      };
    });
  }

  /** Daily attendance % across all batches for the last `days` days. */
  getStudentTrend(days = 30, batchId?: string | null): Observable<TrendPoint[]> {
    return mockCompute(() => {
      const today = todayIso();
      const points: TrendPoint[] = [];
      for (let d = addDays(today, -days + 1); d <= today; d = addDays(d, 1)) {
        if (isSunday(d)) continue;
        const day = this.db.studentAttendance.filter(
          (r) => r.date === d && (!batchId || r.batchId === batchId),
        );
        if (!day.length) continue;
        points.push({
          label: formatDayMonth(d),
          value: pct(day.filter((r) => r.status !== 'Absent').length, day.length),
        });
      }
      return points;
    });
  }

  // ------------------------------------------------------------ staff
  getStaffDaily(date: ISODate): Observable<StaffAttendanceView[]> {
    return mockCompute(() => {
      const records = this.db.staffAttendance.filter((r) => r.date === date);
      return this.db.employees
        .filter((e) => e.status === 'Active' && e.joiningDate <= date)
        .map((e) => {
          const record = records.find((r) => r.employeeId === e.id);
          return staffAttendanceView(
            this.db,
            record ?? {
              id: `ST-NEW-${e.id}-${date}`,
              employeeId: e.id,
              date,
              checkIn: null,
              checkOut: null,
              status: 'Absent',
              source: 'Manual',
            },
          );
        })
        .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    });
  }

  correctStaffAttendance(dto: StaffCorrectionDto): Observable<StaffAttendanceView> {
    return mockCompute(() => {
      let record = this.db.staffAttendance.find(
        (r) => r.employeeId === dto.employeeId && r.date === dto.date,
      );
      if (!record) {
        record = {
          id: this.db.nextId('ST', this.db.staffAttendance),
          employeeId: dto.employeeId,
          date: dto.date,
          checkIn: null,
          checkOut: null,
          status: 'Absent',
          source: 'Manual',
        };
        this.db.staffAttendance.push(record);
      }
      Object.assign(record, {
        status: dto.status,
        checkIn: dto.checkIn,
        checkOut: dto.checkOut,
        source: 'Manual',
      });
      return staffAttendanceView(this.db, record);
    });
  }

  getStaffMonthly(month: MonthKey): Observable<StaffMonthlySummary[]> {
    return mockCompute(() => {
      const today = todayIso();
      return this.db.employees
        .filter((e) => e.status === 'Active')
        .map((e) => {
          const records = this.db.staffAttendance.filter(
            (r) => r.employeeId === e.id && r.date.startsWith(month) && r.date <= today,
          );
          const count = (s: StaffAttendanceStatus) => records.filter((r) => r.status === s).length;
          const worked = records.filter((r) => r.checkIn && r.checkOut);
          const present = count('Present');
          const late = count('Late');
          const halfDay = count('Half Day');
          return {
            employeeId: e.id,
            employeeName: e.name,
            department: e.department,
            workingDays: records.length,
            present,
            late,
            halfDay,
            absent: count('Absent'),
            onLeave: count('On Leave'),
            avgMinutes: worked.length
              ? Math.round(worked.reduce((s, r) => s + workingMinutes(r), 0) / worked.length)
              : 0,
            pct: pct(present + late + halfDay * 0.5 + count('On Leave'), records.length),
          };
        });
    });
  }

  getStaffCalendar(employeeId: string, month: MonthKey): Observable<StaffAttendanceView[]> {
    return mockCompute(() =>
      this.db.staffAttendance
        .filter((r) => r.employeeId === employeeId && r.date.startsWith(month))
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((r) => staffAttendanceView(this.db, r)),
    );
  }
}
