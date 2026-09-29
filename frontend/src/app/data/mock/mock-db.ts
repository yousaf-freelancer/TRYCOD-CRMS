import { Injectable } from '@angular/core';
import {
  AppNotification,
  AppSettings,
  Admission,
  Batch,
  CallLog,
  Course,
  Department,
  Employee,
  Enquiry,
  FeePlan,
  FollowUp,
  Lead,
  LeaveRequest,
  LeaveType,
  MentorReport,
  Payment,
  SalaryStructure,
  StaffAttendance,
  Student,
  StudentAttendance,
} from '../../domain/models';
import * as mock from '../mock-data';
import { PayrollRunState } from '../mock-data/payroll.mock';

/**
 * In-memory database used by the data-access services while there is no
 * backend. Every collection is a deep copy of the seed data so create / edit /
 * delete work during a demo session. When the NestJS API is ready, services
 * switch to HttpClient and this class can be deleted.
 */
@Injectable({ providedIn: 'root' })
export class MockDb {
  readonly courses: Course[] = structuredClone(mock.COURSES);
  readonly batches: Batch[] = structuredClone(mock.BATCHES);
  readonly employees: Employee[] = structuredClone(mock.EMPLOYEES);
  readonly departments: Department[] = structuredClone(mock.DEPARTMENTS);
  readonly salaryStructures: SalaryStructure[] = structuredClone(mock.SALARY_STRUCTURES);
  readonly students: Student[] = structuredClone(mock.STUDENTS);
  readonly feePlans: FeePlan[] = structuredClone(mock.FEE_PLANS);
  readonly payments: Payment[] = structuredClone(mock.PAYMENTS);
  readonly leads: Lead[] = structuredClone(mock.LEADS);
  readonly enquiries: Enquiry[] = structuredClone(mock.ENQUIRIES);
  readonly followUps: FollowUp[] = structuredClone(mock.FOLLOW_UPS);
  readonly admissions: Admission[] = structuredClone(mock.ADMISSIONS);
  readonly leaveTypes: LeaveType[] = structuredClone(mock.LEAVE_TYPES);
  readonly leaveRequests: LeaveRequest[] = structuredClone(mock.LEAVE_REQUESTS);
  readonly studentAttendance: StudentAttendance[] = structuredClone(mock.STUDENT_ATTENDANCE);
  readonly staffAttendance: StaffAttendance[] = structuredClone(mock.STAFF_ATTENDANCE);
  readonly payrollRuns: PayrollRunState[] = structuredClone(mock.PAYROLL_RUNS);
  readonly mentorReports: MentorReport[] = structuredClone(mock.MENTOR_REPORTS);
  readonly calls: CallLog[] = structuredClone(mock.CALL_LOGS);
  readonly notifications: AppNotification[] = structuredClone(mock.NOTIFICATIONS);
  settings: AppSettings = structuredClone(mock.SETTINGS);

  private readonly counters = new Map<string, number>();

  /** Generates the next id for a prefix, e.g. `nextId('LD', this.leads)` → `LD-2173`. */
  nextId(prefix: string, existing: readonly { id: string }[]): string {
    const current =
      this.counters.get(prefix) ??
      existing.reduce((max, item) => {
        const n = Number(item.id.split('-').pop());
        return Number.isFinite(n) && n > max ? n : max;
      }, 0);
    const next = current + 1;
    this.counters.set(prefix, next);
    return `${prefix}-${next}`;
  }

  course(id: string): Course | undefined {
    return this.courses.find((c) => c.id === id);
  }

  batch(id: string): Batch | undefined {
    return this.batches.find((b) => b.id === id);
  }

  employee(id: string | null | undefined): Employee | undefined {
    return id ? this.employees.find((e) => e.id === id) : undefined;
  }

  student(id: string): Student | undefined {
    return this.students.find((s) => s.id === id);
  }

  employeeName(id: string | null | undefined): string {
    return this.employee(id)?.name ?? '—';
  }

  courseName(id: string): string {
    return this.course(id)?.name ?? '—';
  }

  batchCode(id: string): string {
    return this.batch(id)?.code ?? '—';
  }
}
