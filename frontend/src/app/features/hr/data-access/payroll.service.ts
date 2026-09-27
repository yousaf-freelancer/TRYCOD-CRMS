import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { payrollEntries, payslip } from '../../../core/mock/derive';
import { MockDb } from '../../../core/mock/mock-db';
import { mockCompute } from '../../../core/mock/mock-response';
import { MonthKey, PayrollRun, PayrollRunSummary, Payslip } from '../../../models';
import { todayIso } from '../../../shared/utils/date.util';

export interface EmployeePayslipRow {
  month: MonthKey;
  status: PayrollRun['status'];
  gross: number;
  deductions: number;
  netPay: number;
}

/** Payroll. Later: `GET /api/payroll/runs`, `POST /api/payroll/runs/:month/process`, `GET /api/payslips/...`. */
@Injectable({ providedIn: 'root' })
export class PayrollService {
  private readonly db = inject(MockDb);

  getRuns(): Observable<PayrollRunSummary[]> {
    return mockCompute(() =>
      [...this.db.payrollRuns]
        .sort((a, b) => b.month.localeCompare(a.month))
        .map((run) => {
          const entries = payrollEntries(this.db, run.month);
          return {
            month: run.month,
            status: run.status,
            processedOn: run.processedOn,
            employees: entries.length,
            gross: sum(entries.map((e) => e.gross)),
            deductions: sum(entries.map((e) => e.deductions + e.lopAmount)),
            netPay: sum(entries.map((e) => e.netPay)),
          };
        }),
    );
  }

  getRun(month: MonthKey): Observable<PayrollRun | null> {
    return mockCompute(() => {
      const run = this.db.payrollRuns.find((r) => r.month === month);
      return run ? { ...run, entries: payrollEntries(this.db, month) } : null;
    });
  }

  processRun(month: MonthKey): Observable<PayrollRun> {
    return mockCompute(() => {
      const run = this.db.payrollRuns.find((r) => r.month === month)!;
      run.status = 'Processed';
      run.processedOn = todayIso();
      return { ...run, entries: payrollEntries(this.db, month) };
    }, 900);
  }

  getPayslip(employeeId: string, month: MonthKey): Observable<Payslip | null> {
    return mockCompute(() => payslip(this.db, employeeId, month));
  }

  getEmployeePayslips(employeeId: string): Observable<EmployeePayslipRow[]> {
    return mockCompute(() =>
      [...this.db.payrollRuns]
        .sort((a, b) => b.month.localeCompare(a.month))
        .flatMap((run) => {
          const entry = payrollEntries(this.db, run.month).find((e) => e.employeeId === employeeId);
          return entry
            ? [
                {
                  month: run.month,
                  status: run.status,
                  gross: entry.gross,
                  deductions: entry.deductions + entry.lopAmount,
                  netPay: entry.netPay,
                },
              ]
            : [];
        }),
    );
  }
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
