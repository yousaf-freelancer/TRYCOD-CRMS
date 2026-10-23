import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client';
import { MonthKey, PayrollRun, PayrollRunSummary, Payslip } from '../../domain/models';

export interface EmployeePayslipRow {
  month: MonthKey;
  status: PayrollRun['status'];
  gross: number;
  deductions: number;
  netPay: number;
}

/** Payroll: `/payroll/runs`, `/payroll/runs/:month/process`, `/payslips/...`. */
@Injectable({ providedIn: 'root' })
export class PayrollService {
  private readonly api = inject(ApiClient);

  getRuns(): Observable<PayrollRunSummary[]> {
    return this.api.get<PayrollRunSummary[]>('payroll/runs', []);
  }

  getRun(month: MonthKey): Observable<PayrollRun | null> {
    return this.api.get<PayrollRun | null>(`payroll/runs/${month}`, null);
  }

  processRun(month: MonthKey): Observable<PayrollRun> {
    return this.api.post<PayrollRun>(`payroll/runs/${month}/process`);
  }

  getPayslip(employeeId: string, month: MonthKey): Observable<Payslip | null> {
    return this.api.get<Payslip | null>(`payslips/${employeeId}/${month}`, null);
  }

  getEmployeePayslips(employeeId: string): Observable<EmployeePayslipRow[]> {
    return this.api.get<EmployeePayslipRow[]>(`payslips/${employeeId}`, []);
  }
}
