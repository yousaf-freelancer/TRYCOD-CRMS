import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import {
  AdmissionView,
  CallStats,
  DueItem,
  FunnelStats,
  LeadView,
  MentorReportView,
  PaymentFilters,
  PaymentView,
  PayrollRunSummary,
  PendingReportSummary,
  StaffMonthlySummary,
  StudentListItem,
  TrendPoint,
} from '../../../models';
import { AdmissionsService } from '../../admissions/data-access/admissions.service';
import { AttendanceService } from '../../attendance/data-access/attendance.service';
import { CallsService } from '../../calls/data-access/calls.service';
import { FeesService } from '../../fees/data-access/fees.service';
import { PayrollService } from '../../hr/data-access/payroll.service';
import { MentorReportsService } from '../../mentor-reports/data-access/mentor-reports.service';
import { StudentsService } from '../../students/data-access/students.service';

export interface DateRangeFilter {
  from: string | null;
  to: string | null;
}

/**
 * Report data. Today it composes the feature services; later each method maps
 * to a server-side report endpoint (e.g. `GET /api/reports/fee-collection`).
 */
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly admissions = inject(AdmissionsService);
  private readonly fees = inject(FeesService);
  private readonly attendance = inject(AttendanceService);
  private readonly students = inject(StudentsService);
  private readonly payroll = inject(PayrollService);
  private readonly calls = inject(CallsService);
  private readonly mentorReports = inject(MentorReportsService);

  admissionsReport(
    range: DateRangeFilter,
  ): Observable<{ funnel: FunnelStats; admissions: AdmissionView[]; leads: LeadView[] }> {
    return forkJoin({
      funnel: this.admissions.getFunnel(range.from, range.to),
      admissions: this.admissions.getAdmissions({ from: range.from, to: range.to }),
      leads: this.admissions
        .getLeads()
        .pipe(
          map((l) =>
            l.filter(
              (x) =>
                (!range.from || x.createdOn >= range.from) &&
                (!range.to || x.createdOn <= range.to),
            ),
          ),
        ),
    });
  }

  feeCollection(filters: PaymentFilters): Observable<PaymentView[]> {
    return this.fees.getPayments(filters);
  }

  pendingFees(): Observable<DueItem[]> {
    return this.fees.getDues();
  }

  studentAttendance(
    batchId: string | null,
  ): Observable<{ students: StudentListItem[]; trend: TrendPoint[] }> {
    return forkJoin({
      students: this.students.getStudents({ batchId, status: 'Active' }),
      trend: this.attendance.getStudentTrend(30, batchId),
    });
  }

  staffAttendance(month: string): Observable<StaffMonthlySummary[]> {
    return this.attendance.getStaffMonthly(month);
  }

  payrollSummary(): Observable<PayrollRunSummary[]> {
    return this.payroll.getRuns();
  }

  salesCalls(range: DateRangeFilter): Observable<CallStats[]> {
    return this.calls.getStats(range);
  }

  mentorReportsReport(
    weekStart: string | null,
  ): Observable<{ reports: MentorReportView[]; pending: PendingReportSummary[] }> {
    return forkJoin({
      reports: this.mentorReports.getReports({ weekStart }),
      pending: this.mentorReports.getPending(),
    });
  }

  recentWeeks(count = 8): string[] {
    return this.mentorReports.recentWeeks(count);
  }
}
