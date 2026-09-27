import { FeePlan, Installment, Payment, PaymentMode } from '../models';
import { addDays, addMonths, diffDays } from '../shared/utils/date.util';
import { COURSES } from './courses.mock';
import { STUDENTS } from './students.mock';
import { TODAY, chance, createRng, int, pick, weighted } from './seed';

const rng = createRng(4401);

/** Staff who collect fees at the front desk. */
export const FEE_COLLECTORS = ['EMP-003', 'EMP-004', 'EMP-005', 'EMP-019', 'EMP-017'] as const;

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export function referenceFor(mode: PaymentMode, seed: () => number): string {
  const digits = (n: number) => Array.from({ length: n }, () => Math.floor(seed() * 10)).join('');
  switch (mode) {
    case 'UPI':
      return `UPI/${digits(12)}`;
    case 'Card':
      return `CARD XXXX${digits(4)}`;
    case 'Bank Transfer':
      return `NEFT/${pick(seed, ['HDFC', 'SBIN', 'FDRL', 'ICIC', 'UTIB'] as const)}${digits(10)}`;
    default:
      return '';
  }
}

/** Splits a net fee into a down payment (~30%) and equal monthly installments. */
export function buildInstallments(
  studentId: string,
  netFee: number,
  count: number,
  firstDue: string,
  gapMonths = 1,
): Installment[] {
  if (count <= 1) {
    return [
      {
        id: `${studentId}-I1`,
        studentId,
        number: 1,
        dueDate: firstDue,
        amount: netFee,
        paidAmount: 0,
      },
    ];
  }
  const down = roundTo(netFee * 0.3, 500);
  const rest = netFee - down;
  const each = roundTo(rest / (count - 1), 500);
  return Array.from({ length: count }, (_, i) => {
    const amount = i === 0 ? down : i === count - 1 ? rest - each * (count - 2) : each;
    return {
      id: `${studentId}-I${i + 1}`,
      studentId,
      number: i + 1,
      dueDate: i === 0 ? firstDue : addMonths(firstDue, i * gapMonths),
      amount,
      paidAmount: 0,
    };
  });
}

function build(): { plans: FeePlan[]; payments: Payment[] } {
  const plans: FeePlan[] = [];
  const raw: Omit<Payment, 'id' | 'receiptNo'>[] = [];

  const pay = (inst: Installment, amount: number, date: string) => {
    const mode = weighted<PaymentMode>(rng, [
      ['UPI', 45],
      ['Bank Transfer', 22],
      ['Cash', 22],
      ['Card', 11],
    ]);
    inst.paidAmount += amount;
    raw.push({
      studentId: inst.studentId,
      amount,
      mode,
      reference: referenceFor(mode, rng),
      date,
      collectedBy: pick(rng, FEE_COLLECTORS),
      note: inst.number === 1 ? 'Admission / first installment' : `Installment ${inst.number}`,
    });
  };

  for (const student of STUDENTS) {
    const course = COURSES.find((c) => c.id === student.courseId)!;
    const discount = pick(rng, [0, 0, 0, 2500, 5000, roundTo(course.fee * 0.1, 500)] as const);
    const net = course.fee - discount;
    const isDemo = student.id === 'STU-1001';
    const planType = !isDemo && chance(rng, 0.28) ? 'Full' : 'Installments';

    let installments: Installment[];
    if (planType === 'Full') {
      installments = buildInstallments(student.id, net, 1, student.admissionDate);
    } else if (isDemo) {
      installments = buildInstallments(student.id, net, 4, student.admissionDate, 2);
      installments[3].dueDate = addDays(TODAY, 9);
    } else {
      installments = buildInstallments(
        student.id,
        net,
        course.durationMonths >= 5 ? 4 : 3,
        student.admissionDate,
      );
    }

    for (const inst of installments) {
      const due = inst.dueDate;
      const isPast = diffDays(due, TODAY) <= 0;
      const clampDate = (d: string) =>
        d < student.admissionDate ? student.admissionDate : d > TODAY ? TODAY : d;

      if (inst.number === 1) {
        pay(inst, inst.amount, student.admissionDate);
      } else if (student.status === 'Completed') {
        pay(inst, inst.amount, clampDate(addDays(due, int(rng, -5, 4))));
      } else if (student.status === 'Dropped') {
        continue;
      } else if (isDemo) {
        if (isPast) pay(inst, inst.amount, clampDate(addDays(due, -int(rng, 0, 3))));
      } else if (isPast) {
        const roll = rng();
        if (roll < 0.8) pay(inst, inst.amount, clampDate(addDays(due, int(rng, -6, 5))));
        else if (roll < 0.87)
          pay(inst, roundTo(inst.amount * 0.5, 500), clampDate(addDays(due, int(rng, -3, 3))));
      } else if (chance(rng, 0.07)) {
        pay(inst, inst.amount, clampDate(addDays(TODAY, -int(rng, 0, 12))));
      }
    }

    plans.push({
      studentId: student.id,
      courseId: course.id,
      planType,
      totalFee: course.fee,
      discount,
      installments,
    });
  }

  // A few collections today so "collected today" is never empty.
  let todayCount = 0;
  for (const plan of plans) {
    if (todayCount >= 4 || plan.studentId === 'STU-1001') continue;
    const next = plan.installments.find(
      (i) => i.paidAmount < i.amount && Math.abs(diffDays(i.dueDate, TODAY)) <= 12,
    );
    if (next && chance(rng, 0.35)) {
      pay(next, next.amount - next.paidAmount, TODAY);
      todayCount++;
    }
  }

  raw.sort((a, b) => a.date.localeCompare(b.date));
  const payments: Payment[] = raw.map((p, i) => ({
    ...p,
    id: `PAY-${String(i + 1).padStart(5, '0')}`,
    receiptNo: `TTS-${String(10001 + i)}`,
  }));
  return { plans, payments };
}

const built = build();

export const FEE_PLANS: FeePlan[] = built.plans;
export const PAYMENTS: Payment[] = built.payments;
