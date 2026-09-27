import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { dueItems, feeAccount, studentAttendanceIndex } from '../../../core/mock/derive';
import { MockDb } from '../../../core/mock/mock-db';
import { mockCompute } from '../../../core/mock/mock-response';
import {
  AbsentStudent,
  ActivityItem,
  AdminDashboard,
  AdvisorDashboard,
  FollowUp,
  FollowUpView,
  Lead,
  MentorDashboard,
  SalesDashboard,
  StudentDashboard,
  TrendPoint,
} from '../../../models';
import {
  addDays,
  addMonthKey,
  formatDayMonth,
  isSunday,
  lastMonthKeys,
  lastWorkingDay,
  monthKeyOf,
  monthShortName,
  startOfWeek,
  todayIso,
  weekdayShort,
} from '../../../shared/utils/date.util';
import { formatInr, pct } from '../../../shared/utils/format.util';
import { statsFor } from '../../calls/data-access/calls.service';

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Role dashboards. Later: `GET /api/dashboard/{admin|advisor|mentor|sales|student}`. */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly db = inject(MockDb);

  getAdmin(): Observable<AdminDashboard> {
    return mockCompute(() => {
      const db = this.db;
      const today = todayIso();
      const month = monthKeyOf(today);
      const lastMonth = addMonthKey(month, -1);
      const sameDayLastMonth = `${lastMonth}-${today.slice(8)}`;

      const ref = lastWorkingDay();
      const todays = db.studentAttendance.filter((r) => r.date === ref);
      let prevDay = addDays(ref, -1);
      while (isSunday(prevDay)) prevDay = addDays(prevDay, -1);
      const prev = db.studentAttendance.filter((r) => r.date === prevDay);
      const todayPct = pct(todays.filter((r) => r.status !== 'Absent').length, todays.length);
      const prevPct = pct(prev.filter((r) => r.status !== 'Absent').length, prev.length);

      const collectedMonth = sum(
        db.payments.filter((p) => p.date.startsWith(month)).map((p) => p.amount),
      );
      const collectedLastToDate = sum(
        db.payments
          .filter((p) => p.date.startsWith(lastMonth) && p.date <= sameDayLastMonth)
          .map((p) => p.amount),
      );
      const dues = dueItems(db);
      const admissionsMonth = db.admissions.filter((a) => a.admissionDate.startsWith(month)).length;
      const admissionsLast = db.admissions.filter(
        (a) => a.admissionDate.startsWith(lastMonth) && a.admissionDate <= sameDayLastMonth,
      ).length;

      const staffToday = db.staffAttendance.filter((r) => r.date === ref);
      const activeStaff = db.employees.filter((e) => e.status === 'Active').length;

      const attendanceTrend: TrendPoint[] = [];
      for (let d = addDays(today, -29); d <= today; d = addDays(d, 1)) {
        const day = db.studentAttendance.filter((r) => r.date === d);
        if (day.length)
          attendanceTrend.push({
            label: formatDayMonth(d),
            value: pct(day.filter((r) => r.status !== 'Absent').length, day.length),
          });
      }

      const from30 = addDays(today, -30);
      return {
        asOf: ref,
        activeStudents: db.students.filter((s) => s.status === 'Active').length,
        activeStudentsChange: admissionsMonth,
        todayAttendancePct: todayPct,
        attendanceChange: Math.round((todayPct - prevPct) * 10) / 10,
        staffPresent: staffToday.filter((r) => ['Present', 'Late', 'Half Day'].includes(r.status))
          .length,
        staffTotal: activeStaff,
        feesCollectedMonth: collectedMonth,
        feesChangePct: collectedLastToDate
          ? Math.round(((collectedMonth - collectedLastToDate) / collectedLastToDate) * 100)
          : 0,
        pendingFees: sum(dues.map((d) => d.balance)),
        overdueCount: dues.filter((d) => d.status === 'Overdue').length,
        newAdmissionsMonth: admissionsMonth,
        admissionsChange: admissionsMonth - admissionsLast,
        feeTrend: lastMonthKeys(7).map((key) => ({
          label: monthShortName(key),
          value: sum(db.payments.filter((p) => p.date.startsWith(key)).map((p) => p.amount)),
        })),
        attendanceTrend,
        batchStrength: db.batches
          .filter((b) => b.status !== 'Completed')
          .map((b) => ({
            label: b.code,
            value: db.students.filter((s) => s.batchId === b.id && s.status === 'Active').length,
          })),
        funnel: {
          leads: db.leads.filter((l) => l.createdOn >= from30).length,
          enquiries: db.enquiries.filter((e) => e.enquiryDate >= from30).length,
          admissions: db.admissions.filter((a) => a.admissionDate >= from30).length,
        },
        dues: dues.filter((d) => d.status === 'Overdue').slice(0, 6),
        absentToday: this.absentToday(),
        staffOnLeave: db.leaveRequests
          .filter((l) => l.status === 'Approved' && l.from <= ref && l.to >= ref)
          .map((l) => {
            const emp = db.employee(l.employeeId)!;
            return {
              employeeId: emp.id,
              employeeName: emp.name,
              designation: emp.designation,
              leaveType: db.leaveTypes.find((t) => t.id === l.leaveTypeId)?.name ?? '',
              until: l.to,
            };
          }),
        activity: this.activity(),
      };
    });
  }

  getAdvisor(employeeId: string): Observable<AdvisorDashboard> {
    return mockCompute(() => {
      const db = this.db;
      const today = todayIso();
      const month = monthKeyOf(today);
      const mine = db.followUps.filter(
        (f) => f.assignedTo === employeeId && f.status === 'Pending',
      );
      const myPayments = db.payments.filter(
        (p) => p.collectedBy === employeeId && p.date.startsWith(month),
      );
      const newEnquiries = db.enquiries.filter(
        (e) => e.assignedTo === employeeId && (e.status === 'New' || e.status === 'Counselling'),
      );
      return {
        followUpsToday: mine
          .filter((f) => f.dueDate === today)
          .map((f) => this.followUpView(f, 'Today')),
        overdueFollowUps: mine.filter((f) => f.dueDate < today).length,
        newEnquiries: newEnquiries
          .slice(0, 5)
          .map((e) => ({
            ...e,
            courseName: db.courseName(e.courseId),
            assignedToName: db.employeeName(e.assignedTo),
          })),
        newEnquiriesCount: newEnquiries.length,
        admissionsMonth: db.admissions.filter(
          (a) => a.advisorId === employeeId && a.admissionDate.startsWith(month),
        ).length,
        admissionsTarget: 12,
        collectedByMe: sum(myPayments.map((p) => p.amount)),
        collectedByMeCount: myPayments.length,
        dues: dueItems(db, addDays(today, 7)).slice(0, 6),
      };
    });
  }

  getMentor(employeeId: string): Observable<MentorDashboard> {
    return mockCompute(() => {
      const db = this.db;
      const today = todayIso();
      const ref = lastWorkingDay();
      const lastWeek = addDays(startOfWeek(today), -7);
      const index = studentAttendanceIndex(db, addDays(today, -30));
      const batches = db.batches
        .filter((b) => b.mentorId === employeeId && b.status !== 'Completed')
        .map((b) => {
          const students = db.students.filter((s) => s.batchId === b.id && s.status === 'Active');
          const todays = db.studentAttendance.filter((r) => r.batchId === b.id && r.date === ref);
          const reported = new Set(
            db.mentorReports
              .filter((r) => r.batchId === b.id && r.weekStart === lastWeek)
              .map((r) => r.studentId),
          );
          const pcts = students
            .map((s) => index.get(s.id)?.pct)
            .filter((v): v is number => v !== undefined);
          return {
            ...b,
            courseName: db.courseName(b.courseId),
            mentorName: db.employeeName(b.mentorId),
            enrolled: students.length,
            todayMarked: todays.length > 0,
            todayPresentPct: todays.length
              ? pct(todays.filter((r) => r.status !== 'Absent').length, todays.length)
              : null,
            avgAttendancePct: pcts.length ? Math.round((sum(pcts) / pcts.length) * 10) / 10 : 0,
            pendingReports:
              b.status === 'Ongoing' && b.startDate <= lastWeek
                ? students.filter((s) => !reported.has(s.id)).length
                : 0,
          };
        });
      const ongoing = batches.filter((b) => b.status === 'Ongoing');
      const myStudents = db.students.filter(
        (s) => s.status === 'Active' && batches.some((b) => b.id === s.batchId),
      );
      return {
        asOf: ref,
        batches,
        studentsCount: myStudents.length,
        toMarkToday: ongoing.filter((b) => !b.todayMarked).length,
        avgAttendancePct: ongoing.length
          ? Math.round((sum(ongoing.map((b) => b.avgAttendancePct)) / ongoing.length) * 10) / 10
          : 0,
        pendingReports: batches
          .filter((b) => b.pendingReports > 0)
          .map((b) => ({
            batchId: b.id,
            batchCode: b.code,
            courseName: b.courseName,
            mentorId: b.mentorId,
            mentorName: b.mentorName,
            weekStart: lastWeek,
            pendingCount: b.pendingReports,
            totalStudents: b.enrolled,
          })),
        lowAttendance: myStudents
          .map((s) => ({
            studentId: s.id,
            studentName: s.name,
            batchCode: db.batchCode(s.batchId),
            pct: index.get(s.id)?.pct ?? 0,
          }))
          .filter((s) => s.pct > 0 && s.pct < 75)
          .sort((a, b) => a.pct - b.pct)
          .slice(0, 6),
      };
    });
  }

  getSales(employeeId: string): Observable<SalesDashboard> {
    return mockCompute(() => {
      const db = this.db;
      const today = todayIso();
      const ref = lastWorkingDay();
      const mine = db.calls.filter((c) => c.salespersonId === employeeId);
      const todays = mine.filter((c) => c.at.startsWith(ref));
      const answered = todays.filter((c) => c.status === 'Answered');
      const weekTrend: SalesDashboard['weekTrend'] = [];
      for (let d = addDays(today, -9); d <= today; d = addDays(d, 1)) {
        if (isSunday(d)) continue;
        const day = mine.filter((c) => c.at.startsWith(d));
        weekTrend.push({
          label: `${weekdayShort(d)} ${d.slice(8)}`,
          answered: day.filter((c) => c.status === 'Answered').length,
          missed: day.filter((c) => c.status === 'Missed').length,
        });
      }
      const openLeads = db.leads.filter(
        (l) => l.assignedTo === employeeId && l.status !== 'Converted' && l.status !== 'Lost',
      );
      return {
        asOf: ref,
        callsToday: todays.length,
        answeredToday: answered.length,
        missedToday: todays.length - answered.length,
        talkTimeToday: sum(answered.map((c) => c.durationSec)),
        callsByHour: Array.from({ length: 10 }, (_, i) => i + 9).map((h) => ({
          label: `${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`,
          value: todays.filter((c) => Number(c.at.slice(11, 13)) === h).length,
        })),
        weekTrend: weekTrend.slice(-7),
        followUpsDue: db.followUps
          .filter(
            (f) => f.assignedTo === employeeId && f.status === 'Pending' && f.dueDate <= today,
          )
          .sort((a, b) => (a.dueDate + a.dueTime).localeCompare(b.dueDate + b.dueTime))
          .map((f) => this.followUpView(f, f.dueDate === today ? 'Today' : 'Overdue')),
        myLeads: openLeads
          .slice(0, 6)
          .map((l: Lead) => ({
            ...l,
            courseName: db.courseName(l.courseId),
            assignedToName: db.employeeName(l.assignedTo),
          })),
        myLeadsCount: openLeads.length,
        stats: statsFor(
          employeeId,
          db.employeeName(employeeId),
          mine.filter((c) => c.at.startsWith(monthKeyOf(today))),
        ),
      };
    });
  }

  getStudent(studentId: string): Observable<StudentDashboard | null> {
    return mockCompute(() => {
      const db = this.db;
      const student = db.student(studentId);
      const account = feeAccount(db, studentId);
      if (!student || !account) return null;
      const batch = db.batch(student.batchId);
      const records = db.studentAttendance.filter((r) => r.studentId === studentId);
      const month = monthKeyOf(todayIso());
      const monthRecords = records.filter((r) => r.date.startsWith(month));
      const latest = db.mentorReports
        .filter((r) => r.studentId === studentId)
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
      return {
        studentId,
        studentName: student.name,
        courseName: db.courseName(student.courseId),
        batchCode: batch?.code ?? '—',
        mentorName: db.employeeName(batch?.mentorId),
        timing: batch?.timing ?? '',
        attendancePct: pct(records.filter((r) => r.status !== 'Absent').length, records.length),
        monthPresent: monthRecords.filter((r) => r.status !== 'Absent').length,
        monthWorking: monthRecords.length,
        netFee: account.netFee,
        paid: account.paid,
        balance: account.balance,
        nextDue: account.nextDue,
        latestReport: latest
          ? {
              ...latest,
              studentName: student.name,
              batchCode: batch?.code ?? '—',
              mentorName: db.employeeName(latest.mentorId),
            }
          : null,
      };
    });
  }

  private followUpView(f: FollowUp, bucket: FollowUpView['bucket']): FollowUpView {
    return {
      ...f,
      courseName: this.db.courseName(f.courseId),
      assignedToName: this.db.employeeName(f.assignedTo),
      bucket,
    };
  }

  private absentToday(): AbsentStudent[] {
    const db = this.db;
    const today = lastWorkingDay();
    return db.studentAttendance
      .filter((r) => r.date === today && r.status === 'Absent')
      .map((r) => {
        const student = db.student(r.studentId)!;
        const history = db.studentAttendance
          .filter((x) => x.studentId === r.studentId && x.date <= today)
          .sort((a, b) => b.date.localeCompare(a.date));
        let consecutive = 0;
        for (const h of history) {
          if (h.status !== 'Absent') break;
          consecutive++;
        }
        return {
          studentId: student.id,
          studentName: student.name,
          batchCode: db.batchCode(r.batchId),
          phone: student.phone,
          consecutive,
        };
      })
      .sort((a, b) => b.consecutive - a.consecutive);
  }

  private activity(): ActivityItem[] {
    const db = this.db;
    const items: ActivityItem[] = [];
    const payments = [...db.payments]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .slice(0, 4);
    payments.forEach((p, i) =>
      items.push({
        id: `act-p-${p.id}`,
        kind: 'payment',
        text: `${formatInr(p.amount)} received from ${db.student(p.studentId)?.name ?? 'student'}`,
        meta: `${p.mode} · ${db.employeeName(p.collectedBy)}`,
        at: `${p.date}T${String(17 - i).padStart(2, '0')}:${String(10 + i * 7).padStart(2, '0')}:00`,
      }),
    );
    [...db.admissions]
      .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate))
      .slice(0, 3)
      .forEach((a, i) =>
        items.push({
          id: `act-a-${a.id}`,
          kind: 'admission',
          text: `${a.studentName} admitted to ${db.courseName(a.courseId)}`,
          meta: `${db.batchCode(a.batchId)} · ${db.employeeName(a.advisorId)}`,
          at: `${a.admissionDate}T${String(12 - i).padStart(2, '0')}:20:00`,
        }),
      );
    [...db.leaveRequests]
      .sort((a, b) => b.appliedOn.localeCompare(a.appliedOn))
      .slice(0, 2)
      .forEach((l) =>
        items.push({
          id: `act-l-${l.id}`,
          kind: 'leave',
          text: `${db.employeeName(l.employeeId)} applied for ${l.days} day${l.days === 1 ? '' : 's'} leave`,
          meta: `${db.leaveTypes.find((t) => t.id === l.leaveTypeId)?.name ?? ''} · ${l.status}`,
          at: l.appliedOn,
        }),
      );
    const latestReport = [...db.mentorReports].sort((a, b) =>
      b.submittedAt.localeCompare(a.submittedAt),
    )[0];
    if (latestReport) {
      items.push({
        id: `act-r-${latestReport.id}`,
        kind: 'report',
        text: `${db.employeeName(latestReport.mentorId)} submitted weekly reports`,
        meta: db.batchCode(latestReport.batchId),
        at: latestReport.submittedAt,
      });
    }
    const now = todayIso() + 'T23:59:59';
    return items
      .filter((i) => i.at <= now)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 8);
  }
}
