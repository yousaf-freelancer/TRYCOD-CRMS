import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client';
import {
  AdminDashboard,
  AdvisorDashboard,
  MentorDashboard,
  SalesDashboard,
  StudentDashboard,
} from '../../domain/models';
import { todayIso } from '../../shared/utils/date.util';

/** Role dashboards: `GET /dashboard/{admin|advisor|mentor|sales|student}`. */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiClient);

  getAdmin(): Observable<AdminDashboard> {
    return this.api.get<AdminDashboard>('dashboard/admin', emptyAdmin());
  }

  getAdvisor(employeeId: string): Observable<AdvisorDashboard> {
    return this.api.get<AdvisorDashboard>('dashboard/advisor', emptyAdvisor(), { employeeId });
  }

  getMentor(employeeId: string): Observable<MentorDashboard> {
    return this.api.get<MentorDashboard>('dashboard/mentor', emptyMentor(), { employeeId });
  }

  getSales(employeeId: string): Observable<SalesDashboard> {
    return this.api.get<SalesDashboard>('dashboard/sales', emptySales(), { employeeId });
  }

  getStudent(studentId: string): Observable<StudentDashboard | null> {
    return this.api.get<StudentDashboard | null>('dashboard/student', null, { studentId });
  }
}

// Zero states shown until the dashboard endpoints return data.

function emptyAdmin(): AdminDashboard {
  return {
    asOf: todayIso(),
    activeStudents: 0,
    activeStudentsChange: 0,
    todayAttendancePct: 0,
    attendanceChange: 0,
    staffPresent: 0,
    staffTotal: 0,
    feesCollectedMonth: 0,
    feesChangePct: 0,
    pendingFees: 0,
    overdueCount: 0,
    newAdmissionsMonth: 0,
    admissionsChange: 0,
    feeTrend: [],
    attendanceTrend: [],
    batchStrength: [],
    funnel: { leads: 0, enquiries: 0, admissions: 0 },
    dues: [],
    absentToday: [],
    staffOnLeave: [],
    activity: [],
  };
}

function emptyAdvisor(): AdvisorDashboard {
  return {
    followUpsToday: [],
    overdueFollowUps: 0,
    newEnquiries: [],
    newEnquiriesCount: 0,
    admissionsMonth: 0,
    admissionsTarget: 0,
    collectedByMe: 0,
    collectedByMeCount: 0,
    dues: [],
  };
}

function emptyMentor(): MentorDashboard {
  return {
    asOf: todayIso(),
    batches: [],
    studentsCount: 0,
    toMarkToday: 0,
    avgAttendancePct: 0,
    pendingReports: [],
    lowAttendance: [],
  };
}

function emptySales(): SalesDashboard {
  return {
    asOf: todayIso(),
    callsToday: 0,
    answeredToday: 0,
    missedToday: 0,
    talkTimeToday: 0,
    callsByHour: [],
    weekTrend: [],
    followUpsDue: [],
    myLeads: [],
    myLeadsCount: 0,
    stats: null,
  };
}
