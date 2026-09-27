/**
 * Pure functions that derive view data from the in-memory DB. In the real
 * system this logic lives in the NestJS API; keeping it here keeps the
 * services thin and the components unaware of how numbers are produced.
 */
import {
  DueItem,
  FeeAccount,
  FeePlan,
  FeeStatus,
  InstallmentView,
  LeaveBalance,
  MonthKey,
  PayrollEntry,
  Payslip,
  Payment,
  PaymentView,
  StaffAttendance,
  StaffAttendanceView,
} from '../../models';
import { diffDays, isSunday, minutesOf, monthDates, todayIso } from '../../shared/utils/date.util';
import { pct } from '../../shared/utils/format.util';
import { MockDb } from './mock-db';

// ---------------------------------------------------------------- fees

export function installmentViews(plan: FeePlan, today = todayIso()): InstallmentView[] {
  return plan.installments.map((inst) => {
    const balance = Math.max(inst.amount - inst.paidAmount, 0);
    const overdueBy = diffDays(today, inst.dueDate);
    const status: InstallmentView['status'] =
      balance === 0
        ? 'Paid'
        : overdueBy > 0
          ? 'Overdue'
          : inst.paidAmount > 0
            ? 'Partial'
            : 'Pending';
    return { ...inst, balance, status, daysOverdue: status === 'Overdue' ? overdueBy : 0 };
  });
}

export function feeStatusOf(views: InstallmentView[]): FeeStatus {
  if (views.every((v) => v.balance === 0)) return 'Paid';
  if (views.some((v) => v.status === 'Overdue')) return 'Overdue';
  return 'Partial';
}

export function paymentView(db: MockDb, p: Payment): PaymentView {
  const student = db.student(p.studentId);
  return {
    ...p,
    studentName: student?.name ?? '—',
    courseId: student?.courseId ?? '',
    courseName: student ? db.courseName(student.courseId) : '—',
    batchCode: student ? db.batchCode(student.batchId) : '—',
    collectedByName: db.employeeName(p.collectedBy),
  };
}

export function feeAccount(db: MockDb, studentId: string): FeeAccount | null {
  const student = db.student(studentId);
  const plan = db.feePlans.find((p) => p.studentId === studentId);
  if (!student || !plan) return null;
  const installments = installmentViews(plan);
  const netFee = plan.totalFee - plan.discount;
  const paid = plan.installments.reduce((sum, i) => sum + i.paidAmount, 0);
  return {
    studentId,
    studentName: student.name,
    phone: student.phone,
    courseName: db.courseName(student.courseId),
    batchCode: db.batchCode(student.batchId),
    planType: plan.planType,
    totalFee: plan.totalFee,
    discount: plan.discount,
    netFee,
    paid,
    balance: netFee - paid,
    status: feeStatusOf(installments),
    nextDue: installments.find((i) => i.balance > 0) ?? null,
    installments,
    payments: db.payments
      .filter((p) => p.studentId === studentId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((p) => paymentView(db, p)),
  };
}

/** Outstanding installments for active students (optionally only those due by `until`). */
export function dueItems(db: MockDb, until?: string): DueItem[] {
  const items: DueItem[] = [];
  for (const plan of db.feePlans) {
    const student = db.student(plan.studentId);
    if (!student || student.status !== 'Active') continue;
    for (const inst of installmentViews(plan)) {
      if (inst.balance === 0 || (until && inst.dueDate > until)) continue;
      items.push({
        installmentId: inst.id,
        studentId: student.id,
        studentName: student.name,
        phone: student.phone,
        courseName: db.courseName(student.courseId),
        batchCode: db.batchCode(student.batchId),
        installmentNo: inst.number,
        dueDate: inst.dueDate,
        amount: inst.amount,
        balance: inst.balance,
        daysOverdue: inst.daysOverdue,
        status: inst.status,
      });
    }
  }
  return items.sort((a, b) => b.daysOverdue - a.daysOverdue || a.dueDate.localeCompare(b.dueDate));
}

// ---------------------------------------------------------- attendance

export interface AttendanceTally {
  present: number;
  late: number;
  absent: number;
  total: number;
  pct: number;
}

/** Per-student attendance tallies (Late counts as attended). */
export function studentAttendanceIndex(
  db: MockDb,
  from?: string,
  to?: string,
): Map<string, AttendanceTally> {
  const index = new Map<string, AttendanceTally>();
  for (const r of db.studentAttendance) {
    if ((from && r.date < from) || (to && r.date > to)) continue;
    let t = index.get(r.studentId);
    if (!t) {
      t = { present: 0, late: 0, absent: 0, total: 0, pct: 0 };
      index.set(r.studentId, t);
    }
    t.total++;
    if (r.status === 'Present') t.present++;
    else if (r.status === 'Late') t.late++;
    else t.absent++;
  }
  index.forEach((t) => (t.pct = pct(t.present + t.late, t.total)));
  return index;
}

export function workingMinutes(r: StaffAttendance): number {
  if (!r.checkIn || !r.checkOut) return 0;
  return Math.max(minutesOf(r.checkOut) - minutesOf(r.checkIn), 0);
}

export function staffAttendanceView(db: MockDb, r: StaffAttendance): StaffAttendanceView {
  const emp = db.employee(r.employeeId);
  return {
    ...r,
    employeeName: emp?.name ?? '—',
    designation: emp?.designation ?? '',
    department: emp?.department ?? '',
    workingMinutes: workingMinutes(r),
  };
}

// --------------------------------------------------------------- leave

export function leaveBalances(
  db: MockDb,
  employeeId: string,
  year = todayIso().slice(0, 4),
): LeaveBalance[] {
  const requests = db.leaveRequests.filter(
    (r) => r.employeeId === employeeId && r.from.startsWith(year),
  );
  return db.leaveTypes.map((type) => {
    const ofType = requests.filter((r) => r.leaveTypeId === type.id);
    const used = ofType.filter((r) => r.status === 'Approved').reduce((s, r) => s + r.days, 0);
    const pending = ofType.filter((r) => r.status === 'Pending').reduce((s, r) => s + r.days, 0);
    return {
      leaveTypeId: type.id,
      leaveTypeName: type.name,
      code: type.code,
      quota: type.annualQuota,
      used,
      pending,
      available: type.annualQuota ? Math.max(type.annualQuota - used - pending, 0) : 0,
    };
  });
}

// ------------------------------------------------------------- payroll

export function workingDaysIn(month: MonthKey): number {
  return monthDates(month).filter((d) => !isSunday(d)).length;
}

function lopDaysFor(db: MockDb, employeeId: string, month: MonthKey): number {
  return db.staffAttendance
    .filter((r) => r.employeeId === employeeId && r.date.startsWith(month))
    .reduce((sum, r) => sum + (r.status === 'Absent' ? 1 : r.status === 'Half Day' ? 0.5 : 0), 0);
}

export function payrollEntries(db: MockDb, month: MonthKey): PayrollEntry[] {
  const workingDays = workingDaysIn(month);
  return db.employees
    .filter((e) => e.status === 'Active' && e.joiningDate <= `${month}-31`)
    .map((emp) => {
      const s = db.salaryStructures.find((x) => x.employeeId === emp.id)!;
      const gross = s.basic + s.hra + s.conveyance + s.specialAllowance;
      const lopDays = lopDaysFor(db, emp.id, month);
      const lopAmount = Math.round((gross / workingDays) * lopDays);
      const deductions = s.pf + s.esi + s.professionalTax + s.tds;
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        designation: emp.designation,
        department: emp.department,
        workingDays,
        lopDays,
        gross,
        deductions,
        lopAmount,
        netPay: gross - deductions - lopAmount,
      };
    });
}

export function payslip(db: MockDb, employeeId: string, month: MonthKey): Payslip | null {
  const emp = db.employee(employeeId);
  const s = db.salaryStructures.find((x) => x.employeeId === employeeId);
  const run = db.payrollRuns.find((r) => r.month === month);
  const entry = payrollEntries(db, month).find((e) => e.employeeId === employeeId);
  if (!emp || !s || !run || !entry) return null;
  const earnings = [
    { label: 'Basic', amount: s.basic },
    { label: 'House Rent Allowance', amount: s.hra },
    { label: 'Conveyance Allowance', amount: s.conveyance },
    { label: 'Special Allowance', amount: s.specialAllowance },
  ];
  const deductions = [
    { label: 'Provident Fund', amount: s.pf },
    { label: 'ESI', amount: s.esi },
    { label: 'Professional Tax', amount: s.professionalTax },
    { label: 'Income Tax (TDS)', amount: s.tds },
    {
      label: `Loss of Pay (${entry.lopDays} day${entry.lopDays === 1 ? '' : 's'})`,
      amount: entry.lopAmount,
    },
  ].filter((d) => d.amount > 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  return {
    id: `PS-${employeeId}-${month}`,
    month,
    status: run.status,
    employeeId,
    employeeName: emp.name,
    designation: emp.designation,
    department: emp.department,
    joiningDate: emp.joiningDate,
    bankAccount: emp.bankAccount,
    pan: emp.pan,
    workingDays: entry.workingDays,
    paidDays: entry.workingDays - entry.lopDays,
    lopDays: entry.lopDays,
    earnings,
    deductions,
    grossEarnings: entry.gross,
    totalDeductions,
    netPay: entry.gross - totalDeductions,
  };
}
