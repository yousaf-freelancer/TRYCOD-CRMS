import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { PayrollRunSummary } from '../../../models';
import { COLORS, barDataset, cartesianOptions } from '../../../shared/charts/chart-theme';
import { AppDatePipe, InrPipe } from '../../../shared/pipes/format.pipes';
import { downloadCsv } from '../../../shared/utils/csv.util';
import { monthShortName } from '../../../shared/utils/date.util';
import { formatInr } from '../../../shared/utils/format.util';
import { EmptyState } from '../../../shared/ui/empty-state';
import { Panel } from '../../../shared/ui/panel';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { TableSkeleton } from '../../../shared/ui/table-skeleton';
import { ReportsService } from '../data-access/reports.service';
import { ReportSummary, SummaryItem } from '../ui/report-summary';

@Component({
  selector: 'app-payroll-report',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    ChartModule,
    TableModule,
    Panel,
    StatusBadge,
    EmptyState,
    TableSkeleton,
    ReportSummary,
    InrPipe,
    AppDatePipe,
  ],
  template: `
    <div class="mb-4 flex justify-end">
      <button type="button" class="btn btn-secondary" (click)="exportCsv()">
        <svg lucideIcon="download" size="15" /> Export CSV
      </button>
    </div>
    <app-report-summary [items]="summary()" />
    <app-panel class="mt-4" title="Payroll cost by month" subtitle="Net pay and deductions">
      <div class="h-64">
        <p-chart
          type="bar"
          [data]="chart()"
          [options]="options"
          height="100%"
          ariaLabel="Payroll by month"
        />
      </div>
    </app-panel>
    <div class="table-card mt-4">
      @if (runs.isLoading()) {
        <app-table-skeleton [rows]="6" [cols]="6" />
      } @else {
        <p-table [value]="list()" [scrollable]="true" [tableStyle]="{ 'min-width': '800px' }">
          <ng-template #header>
            <tr>
              <th>Month</th>
              <th>Employees</th>
              <th class="text-right">Gross</th>
              <th class="text-right">Deductions</th>
              <th class="text-right">Net pay</th>
              <th>Status</th>
              <th></th>
            </tr>
          </ng-template>
          <ng-template #body let-r>
            <tr>
              <td class="cell-primary">{{ r.month | appDate: 'monthLong' }}</td>
              <td class="tabular-nums">{{ r.employees }}</td>
              <td class="text-right tabular-nums">{{ r.gross | inr }}</td>
              <td class="text-right tabular-nums">{{ r.deductions | inr }}</td>
              <td class="text-right font-semibold tabular-nums">{{ r.netPay | inr }}</td>
              <td><app-status-badge [status]="r.status" /></td>
              <td class="text-right">
                <a routerLink="/hr/payroll" class="btn btn-ghost btn-sm">Open</a>
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage
            ><tr>
              <td colspan="7"><app-empty-state icon="banknote" title="No payroll runs" /></td></tr
          ></ng-template>
        </p-table>
      }
    </div>
  `,
})
export class PayrollReport {
  private readonly service = inject(ReportsService);
  protected readonly options = cartesianOptions('inr', { stacked: true, legend: true });
  protected readonly runs = rxResource({
    stream: () => this.service.payrollSummary(),
    defaultValue: [],
  });
  protected readonly list = computed(() => (this.runs.hasValue() ? this.runs.value() : []));
  protected readonly summary = computed<SummaryItem[]>(() => {
    const processed = this.list().filter((r) => r.status === 'Processed');
    const total = processed.reduce((s, r) => s + r.netPay, 0);
    const latest = processed[0];
    return [
      {
        label: 'Net pay (processed months)',
        value: formatInr(total),
        hint: `${processed.length} months`,
      },
      {
        label: 'Average monthly net',
        value: formatInr(processed.length ? total / processed.length : 0),
      },
      {
        label: 'Last processed',
        value: latest ? formatInr(latest.netPay) : '—',
        hint: latest ? monthShortName(latest.month) : undefined,
      },
      { label: 'Headcount', value: this.list()[0]?.employees ?? '—' },
    ];
  });
  protected readonly chart = computed(() => {
    const l = [...this.list()].reverse();
    return {
      labels: l.map((r) => monthShortName(r.month)),
      datasets: [
        barDataset(
          'Net pay',
          l.map((r) => r.netPay),
          COLORS.indigo,
        ),
        barDataset(
          'Deductions',
          l.map((r) => r.deductions),
          COLORS.amberSoft,
        ),
      ],
    };
  });

  protected exportCsv(): void {
    downloadCsv(
      'payroll-summary',
      [
        { header: 'Month', value: (r: PayrollRunSummary) => r.month },
        { header: 'Employees', value: (r) => r.employees },
        { header: 'Gross', value: (r) => r.gross },
        { header: 'Deductions', value: (r) => r.deductions },
        { header: 'Net pay', value: (r) => r.netPay },
        { header: 'Status', value: (r) => r.status },
        { header: 'Processed on', value: (r) => r.processedOn },
      ],
      this.list(),
    );
  }
}
