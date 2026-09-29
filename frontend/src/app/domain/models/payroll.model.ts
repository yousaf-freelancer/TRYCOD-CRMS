import { ISODate, MonthKey } from './common.model';

export interface SalaryStructure {
  employeeId: string;
  basic: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
}

export type PayrollStatus = 'Draft' | 'Processed';

export interface PayrollEntry {
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  workingDays: number;
  lopDays: number;
  gross: number;
  deductions: number;
  lopAmount: number;
  netPay: number;
}

export interface PayrollRun {
  month: MonthKey;
  status: PayrollStatus;
  processedOn: ISODate | null;
  entries: PayrollEntry[];
}

export interface PayrollRunSummary {
  month: MonthKey;
  status: PayrollStatus;
  processedOn: ISODate | null;
  employees: number;
  gross: number;
  deductions: number;
  netPay: number;
}

export interface PayslipLine {
  label: string;
  amount: number;
}

export interface Payslip {
  id: string;
  month: MonthKey;
  status: PayrollStatus;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  joiningDate: ISODate;
  bankAccount: string;
  pan: string;
  workingDays: number;
  paidDays: number;
  lopDays: number;
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
}
