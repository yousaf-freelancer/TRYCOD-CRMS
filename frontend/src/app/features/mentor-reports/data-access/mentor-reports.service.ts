import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { studentAttendanceIndex } from '../../../core/mock/derive';
import { MockDb } from '../../../core/mock/mock-db';
import { mockCompute } from '../../../core/mock/mock-response';
import {
  ISODate,
  MentorReport,
  MentorReportDraft,
  MentorReportFilters,
  MentorReportView,
  PendingReportSummary,
  SaveMentorReportsDto,
} from '../../../models';
import {
  addDays,
  hmFromMinutes,
  nowMinutes,
  startOfWeek,
  todayIso,
} from '../../../shared/utils/date.util';

/** Weekly mentor reports. Later: `/api/mentor-reports`, `/api/mentor-reports/pending`. */
@Injectable({ providedIn: 'root' })
export class MentorReportsService {
  private readonly db = inject(MockDb);

  /** The last `count` week starts (Mondays), most recent completed week first. */
  recentWeeks(count = 8): ISODate[] {
    const last = addDays(startOfWeek(todayIso()), -7);
    return Array.from({ length: count }, (_, i) => addDays(last, -7 * i));
  }

  /** The current (in-progress) week start — reports can also be drafted for it. */
  currentWeek(): ISODate {
    return startOfWeek(todayIso());
  }

  getReports(filters: MentorReportFilters = {}): Observable<MentorReportView[]> {
    return mockCompute(() =>
      this.db.mentorReports
        .filter(
          (r) =>
            (!filters.batchId || r.batchId === filters.batchId) &&
            (!filters.mentorId || r.mentorId === filters.mentorId) &&
            (!filters.weekStart || r.weekStart === filters.weekStart) &&
            (!filters.studentId || r.studentId === filters.studentId),
        )
        .sort(
          (a, b) =>
            b.weekStart.localeCompare(a.weekStart) || b.submittedAt.localeCompare(a.submittedAt),
        )
        .map((r) => this.toView(r)),
    );
  }

  /** Batches whose report for the last completed week is incomplete. */
  getPending(mentorId?: string | null): Observable<PendingReportSummary[]> {
    return mockCompute(() => {
      const week = this.recentWeeks(1)[0];
      return this.db.batches
        .filter(
          (b) =>
            b.status === 'Ongoing' && b.startDate <= week && (!mentorId || b.mentorId === mentorId),
        )
        .map((b) => {
          const students = this.db.students.filter(
            (s) => s.batchId === b.id && s.status === 'Active',
          );
          const done = new Set(
            this.db.mentorReports
              .filter((r) => r.batchId === b.id && r.weekStart === week)
              .map((r) => r.studentId),
          );
          return {
            batchId: b.id,
            batchCode: b.code,
            courseName: this.db.courseName(b.courseId),
            mentorId: b.mentorId,
            mentorName: this.db.employeeName(b.mentorId),
            weekStart: week,
            pendingCount: students.filter((s) => !done.has(s.id)).length,
            totalStudents: students.length,
          };
        })
        .filter((p) => p.pendingCount > 0);
    });
  }

  getDraft(batchId: string, weekStart: ISODate): Observable<MentorReportDraft[]> {
    return mockCompute(() => {
      const index = studentAttendanceIndex(this.db, weekStart, addDays(weekStart, 6));
      return this.db.students
        .filter((s) => s.batchId === batchId && s.status === 'Active')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => {
          const existing = this.db.mentorReports.find(
            (r) => r.studentId === s.id && r.weekStart === weekStart,
          );
          return {
            studentId: s.id,
            studentName: s.name,
            attendancePct: index.get(s.id)?.pct ?? 0,
            existingId: existing?.id ?? null,
            progressRating: existing?.progressRating ?? 0,
            attendanceRemark: existing?.attendanceRemark ?? '',
            strengths: existing?.strengths ?? '',
            improvements: existing?.improvements ?? '',
            remarks: existing?.remarks ?? '',
          };
        });
    });
  }

  saveReports(dto: SaveMentorReportsDto): Observable<number> {
    return mockCompute(() => {
      const submittedAt = `${todayIso()}T${hmFromMinutes(nowMinutes())}:00`;
      let saved = 0;
      for (const draft of dto.reports) {
        if (!draft.progressRating) continue;
        const fields = {
          progressRating: draft.progressRating,
          attendanceRemark: draft.attendanceRemark,
          strengths: draft.strengths,
          improvements: draft.improvements,
          remarks: draft.remarks,
          submittedAt,
        };
        const existing = draft.existingId
          ? this.db.mentorReports.find((r) => r.id === draft.existingId)
          : undefined;
        if (existing) Object.assign(existing, fields);
        else {
          const report: MentorReport = {
            id: this.db.nextId('MR', this.db.mentorReports),
            studentId: draft.studentId,
            batchId: dto.batchId,
            mentorId: dto.mentorId,
            weekStart: dto.weekStart,
            ...fields,
          };
          this.db.mentorReports.push(report);
        }
        saved++;
      }
      return saved;
    }, 600);
  }

  private toView(r: MentorReport): MentorReportView {
    return {
      ...r,
      studentName: this.db.student(r.studentId)?.name ?? '—',
      batchCode: this.db.batchCode(r.batchId),
      mentorName: this.db.employeeName(r.mentorId),
    };
  }
}
