import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client';
import {
  CreatePaymentDto,
  DueItem,
  FeeAccount,
  FeeSummary,
  PaymentFilters,
  PaymentView,
  Receipt,
  TrendPoint,
} from '../../domain/models';

const EMPTY_SUMMARY: FeeSummary = {
  collectedToday: 0,
  collectedMonth: 0,
  pending: 0,
  overdue: 0,
  studentsWithDues: 0,
  overdueStudents: 0,
};

/** Fees & payments: `/fees/summary`, `/students/:id/fee-account`, `/payments`, `/receipts/:id`. */
@Injectable({ providedIn: 'root' })
export class FeesService {
  private readonly api = inject(ApiClient);

  getSummary(): Observable<FeeSummary> {
    return this.api.get<FeeSummary>('fees/summary', { ...EMPTY_SUMMARY });
  }

  getMonthlyCollection(months = 7): Observable<TrendPoint[]> {
    return this.api.get<TrendPoint[]>('fees/monthly-collection', [], { months });
  }

  getFeeAccount(studentId: string): Observable<FeeAccount | null> {
    return this.api.get<FeeAccount | null>(`students/${studentId}/fee-account`, null);
  }

  getPayments(filters: PaymentFilters = {}): Observable<PaymentView[]> {
    return this.api.get<PaymentView[]>('payments', [], { ...filters });
  }

  getDues(): Observable<DueItem[]> {
    return this.api.get<DueItem[]>('fees/dues', []);
  }

  /** Records a payment; the API allocates it to the oldest unpaid installments first. */
  createPayment(dto: CreatePaymentDto): Observable<Receipt> {
    return this.api.post<Receipt>('payments', dto);
  }

  getReceipt(paymentId: string): Observable<Receipt | null> {
    return this.api.get<Receipt | null>(`receipts/${paymentId}`, null);
  }
}
