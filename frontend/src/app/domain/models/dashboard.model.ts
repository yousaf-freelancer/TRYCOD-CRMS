import { ISODate, ISODateTime } from './common.model';
import { DueItem } from './fee.model';
import { FollowUpView, EnquiryView, LeadView } from './admissions.model';
import { BatchView } from './course.model';
import { PendingReportSummary, MentorReportView } from './mentor-report.model';
import { CallStats } from './call-log.model';
import { InstallmentView } from './fee.model';

export interface TrendPoint {
  label: string;
  value: number;
}

export type ActivityKind = 'payment' | 'admission' | 'leave' | 'attendance' | 'lead' | 'report';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  text: string;
  meta: string;
  at: ISODateTime;
}

export interface AbsentStudent {
  studentId: string;
  studentName: string;
  batchCode: string;
  phone: string;
  consecutive: number;
}

export interface StaffOnLeave {
  employeeId: string;
  employeeName: string;
  designation: string;
  leaveType: string;
  until: ISODate;
}

export interface AdminDashboard {
  /** Reference day for "today" figures (last working day on Sundays). */
  asOf: ISODate;
  activeStudents: number;
  activeStudentsChange: number;
  todayAttendancePct: number;
  attendanceChange: number;
  staffPresent: number;
  staffTotal: number;
  feesCollectedMonth: number;
  feesChangePct: number;
  pendingFees: number;
  overdueCount: number;
  newAdmissionsMonth: number;
  admissionsChange: number;
  feeTrend: TrendPoint[];
  attendanceTrend: TrendPoint[];
  batchStrength: TrendPoint[];
  funnel: { leads: number; enquiries: number; admissions: number };
  dues: DueItem[];
  absentToday: AbsentStudent[];
  staffOnLeave: StaffOnLeave[];
  activity: ActivityItem[];
}

export interface AdvisorDashboard {
  followUpsToday: FollowUpView[];
  overdueFollowUps: number;
  newEnquiries: EnquiryView[];
  newEnquiriesCount: number;
  admissionsMonth: number;
  admissionsTarget: number;
  collectedByMe: number;
  collectedByMeCount: number;
  dues: DueItem[];
}

export interface MentorBatchCard extends BatchView {
  todayMarked: boolean;
  todayPresentPct: number | null;
  avgAttendancePct: number;
  pendingReports: number;
}

export interface MentorDashboard {
  asOf: ISODate;
  batches: MentorBatchCard[];
  studentsCount: number;
  toMarkToday: number;
  avgAttendancePct: number;
  pendingReports: PendingReportSummary[];
  lowAttendance: { studentId: string; studentName: string; batchCode: string; pct: number }[];
}

export interface SalesDashboard {
  asOf: ISODate;
  callsToday: number;
  answeredToday: number;
  missedToday: number;
  talkTimeToday: number;
  callsByHour: TrendPoint[];
  weekTrend: { label: string; answered: number; missed: number }[];
  followUpsDue: FollowUpView[];
  myLeads: LeadView[];
  myLeadsCount: number;
  stats: CallStats | null;
}

export interface StudentDashboard {
  studentId: string;
  studentName: string;
  courseName: string;
  batchCode: string;
  mentorName: string;
  timing: string;
  attendancePct: number;
  monthPresent: number;
  monthWorking: number;
  netFee: number;
  paid: number;
  balance: number;
  nextDue: InstallmentView | null;
  latestReport: MentorReportView | null;
}
