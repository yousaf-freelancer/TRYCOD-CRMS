import { ISODate } from './common.model';

export type FeePlanType = 'Full' | 'Installments';
export type InstallmentStatus = 'Paid' | 'Partial' | 'Pending' | 'Overdue';
export type FeeStatus = 'Paid' | 'Partial' | 'Overdue';
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';

export const PAYMENT_MODES: readonly PaymentMode[] = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

export interface Installment {
  id: string;
  studentId: string;
  number: number;
  dueDate: ISODate;
  amount: number;
  paidAmount: number;
}

export interface FeePlan {
  studentId: string;
  courseId: string;
  planType: FeePlanType;
  totalFee: number;
  discount: number;
  installments: Installment[];
}

/** Installment with derived status (depends on today's date). */
export interface InstallmentView extends Installment {
  status: InstallmentStatus;
  balance: number;
  daysOverdue: number;
}

export interface Payment {
  id: string;
  receiptNo: string;
  studentId: string;
  amount: number;
  mode: PaymentMode;
  reference: string;
  date: ISODate;
  collectedBy: string;
  note: string;
}

export interface PaymentView extends Payment {
  studentName: string;
  courseId: string;
  courseName: string;
  batchCode: string;
  collectedByName: string;
}

export interface FeeAccount {
  studentId: string;
  studentName: string;
  phone: string;
  courseName: string;
  batchCode: string;
  planType: FeePlanType;
  totalFee: number;
  discount: number;
  netFee: number;
  paid: number;
  balance: number;
  status: FeeStatus;
  nextDue: InstallmentView | null;
  installments: InstallmentView[];
  payments: PaymentView[];
}

export interface CreatePaymentDto {
  studentId: string;
  amount: number;
  mode: PaymentMode;
  reference: string;
  date: ISODate;
  collectedBy: string;
  note: string;
}

export interface PaymentFilters {
  from?: ISODate | null;
  to?: ISODate | null;
  mode?: PaymentMode | null;
  courseId?: string | null;
  collectedBy?: string | null;
}

export interface FeeSummary {
  collectedToday: number;
  collectedMonth: number;
  pending: number;
  overdue: number;
  studentsWithDues: number;
  overdueStudents: number;
}

export interface DueItem {
  installmentId: string;
  studentId: string;
  studentName: string;
  phone: string;
  courseName: string;
  batchCode: string;
  installmentNo: number;
  dueDate: ISODate;
  amount: number;
  balance: number;
  daysOverdue: number;
  status: InstallmentStatus;
}

export interface Receipt {
  payment: PaymentView;
  studentPhone: string;
  studentEmail: string;
  netFee: number;
  totalPaid: number;
  balanceAfter: number;
}
