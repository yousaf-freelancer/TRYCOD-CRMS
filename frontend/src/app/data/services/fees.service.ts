import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { dueItems, feeAccount, paymentView } from '../mock/derive';
import { MockDb } from '../mock/mock-db';
import { mockCompute, mockError } from '../mock/mock-response';
import {
  CreatePaymentDto,
  DueItem,
  FeeAccount,
  FeeSummary,
  Payment,
  PaymentFilters,
  PaymentView,
  Receipt,
  TrendPoint,
} from '../../domain/models';
import {
  addDays,
  inRange,
  lastMonthKeys,
  monthKeyOf,
  monthShortName,
  todayIso,
} from '../../shared/utils/date.util';

/** Fees & payments. Later: `/api/fees/summary`, `/api/students/:id/fee-account`, `/api/payments`, `/api/receipts/:id`. */
@Injectable({ providedIn: 'root' })
export class FeesService {
  private readonly db = inject(MockDb);

  getSummary(): Observable<FeeSummary> {
    return mockCompute(() => {
      const today = todayIso();
      const month = monthKeyOf(today);
      const dues = dueItems(this.db);
      const overdue = dues.filter((d) => d.status === 'Overdue');
      return {
        collectedToday: sum(this.db.payments.filter((p) => p.date === today).map((p) => p.amount)),
        collectedMonth: sum(
          this.db.payments.filter((p) => p.date.startsWith(month)).map((p) => p.amount),
        ),
        pending: sum(dues.map((d) => d.balance)),
        overdue: sum(overdue.map((d) => d.balance)),
        studentsWithDues: new Set(
          dues.filter((d) => d.dueDate <= addDays(today, 30)).map((d) => d.studentId),
        ).size,
        overdueStudents: new Set(overdue.map((d) => d.studentId)).size,
      };
    });
  }

  getMonthlyCollection(months = 7): Observable<TrendPoint[]> {
    return mockCompute(() =>
      lastMonthKeys(months).map((key) => ({
        label: monthShortName(key),
        value: sum(this.db.payments.filter((p) => p.date.startsWith(key)).map((p) => p.amount)),
      })),
    );
  }

  getFeeAccount(studentId: string): Observable<FeeAccount | null> {
    return mockCompute(() => feeAccount(this.db, studentId));
  }

  getPayments(filters: PaymentFilters = {}): Observable<PaymentView[]> {
    return mockCompute(() =>
      this.db.payments
        .filter(
          (p) =>
            inRange(p.date, filters.from, filters.to) &&
            (!filters.mode || p.mode === filters.mode) &&
            (!filters.collectedBy || p.collectedBy === filters.collectedBy) &&
            (!filters.courseId || this.db.student(p.studentId)?.courseId === filters.courseId),
        )
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
        .map((p) => paymentView(this.db, p)),
    );
  }

  getDues(): Observable<DueItem[]> {
    return mockCompute(() => dueItems(this.db));
  }

  /** Records a payment, allocating it to the oldest unpaid installments first. */
  createPayment(dto: CreatePaymentDto): Observable<Receipt> {
    const account = feeAccount(this.db, dto.studentId);
    if (!account) return mockError('Student fee account not found.');
    if (dto.amount <= 0 || dto.amount > account.balance) {
      return mockError(
        `Amount must be between ₹1 and the balance of ₹${account.balance.toLocaleString('en-IN')}.`,
      );
    }
    return mockCompute(() => {
      const plan = this.db.feePlans.find((p) => p.studentId === dto.studentId)!;
      let remaining = dto.amount;
      for (const inst of [...plan.installments].sort((a, b) => a.number - b.number)) {
        if (remaining <= 0) break;
        const due = inst.amount - inst.paidAmount;
        const applied = Math.min(due, remaining);
        inst.paidAmount += applied;
        remaining -= applied;
      }
      const seq = this.db.payments.length + 1;
      const payment: Payment = {
        ...dto,
        id: `PAY-${String(seq).padStart(5, '0')}`,
        receiptNo: `${this.db.settings.fees.receiptPrefix}${10000 + seq}`,
      };
      this.db.payments.push(payment);
      return this.receiptFor(payment);
    }, 600);
  }

  getReceipt(paymentId: string): Observable<Receipt | null> {
    return mockCompute(() => {
      const payment = this.db.payments.find((p) => p.id === paymentId);
      return payment ? this.receiptFor(payment) : null;
    });
  }

  private receiptFor(payment: Payment): Receipt {
    const student = this.db.student(payment.studentId)!;
    const plan = this.db.feePlans.find((p) => p.studentId === payment.studentId)!;
    const netFee = plan.totalFee - plan.discount;
    const totalPaid = sum(
      this.db.payments
        .filter(
          (p) =>
            p.studentId === payment.studentId &&
            (p.date < payment.date || (p.date === payment.date && p.id <= payment.id)),
        )
        .map((p) => p.amount),
    );
    return {
      payment: paymentView(this.db, payment),
      studentPhone: student.phone,
      studentEmail: student.email,
      netFee,
      totalPaid,
      balanceAfter: netFee - totalPaid,
    };
  }
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
