import { ISODate, ISODateTime } from './common.model';

export interface MentorReport {
  id: string;
  studentId: string;
  batchId: string;
  mentorId: string;
  weekStart: ISODate;
  progressRating: number;
  attendanceRemark: string;
  strengths: string;
  improvements: string;
  remarks: string;
  submittedAt: ISODateTime;
}

export interface MentorReportView extends MentorReport {
  studentName: string;
  batchCode: string;
  mentorName: string;
}

export interface MentorReportFilters {
  batchId?: string | null;
  mentorId?: string | null;
  weekStart?: ISODate | null;
  studentId?: string | null;
}

export interface PendingReportSummary {
  batchId: string;
  batchCode: string;
  courseName: string;
  mentorId: string;
  mentorName: string;
  weekStart: ISODate;
  pendingCount: number;
  totalStudents: number;
}

/** A single student's row in the weekly report form. */
export interface MentorReportDraft {
  studentId: string;
  studentName: string;
  attendancePct: number;
  existingId: string | null;
  progressRating: number;
  attendanceRemark: string;
  strengths: string;
  improvements: string;
  remarks: string;
}

export interface SaveMentorReportsDto {
  batchId: string;
  mentorId: string;
  weekStart: ISODate;
  reports: MentorReportDraft[];
}
