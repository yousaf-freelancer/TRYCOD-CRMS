import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { MonthKey, PayrollEntry } from '../../../../domain/models';
import { AppDatePipe, InrPipe } from '../../../../shared/pipes/format.pipes';
import { downloadCsv } from '../../../../shared/utils/csv.util';
import { formatMonth } from '../../../../shared/utils/date.util';
import { formatInrCompact } from '../../../../shared/utils/format.util';
import { ConfirmService } from '../../../../shared/ui/confirm.service';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header';
import { StatCard } from '../../../../shared/ui/stat-card';
import { StatusBadge } from '../../../../shared/ui/status-badge';
import { TableSkeleton } from '../../../../shared/ui/table-skeleton';
import { ToastService } from '../../../../shared/ui/toast.service';
import { PayrollService } from '../../../../data/services/payroll.service';

@Component({
  selector: 'app-payroll-page',
  imports: [
    FormsModule,
    RouterLink,
    LucideDynamicIcon,
    SelectModule,
    TableModule,
    PageHeader,
    StatCard,
    StatusBadge,
    EmptyState,
    TableSkeleton,
    InrPipe,
    AppDatePipe,
  ],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header
      title="Payroll"
      subtitle="Monthly payroll run with loss-of-pay from attendance."
    >
      <p-select
        [options]="monthOptions()"
        optionLabel="label"
        optionValue="value"
        [(ngModel)]="month"
        class="!w-52"
        ariaLabel="Payroll month"
      />
      <button
        type="button"
        class="btn btn-secondary"
        (click)="exportCsv()"
        [disabled]="!entries().length"
      >
        <svg lucideIcon="download" size="15" /> Export
      </button>
      @if (run.value()?.status === 'Draft') {
        <button type="button" class="btn btn-primary" (click)="process()" [disabled]="processing()">
          <svg
            [lucideIcon]="processing() ? 'loader-circle' : 'play'"
            size="15"
            [class.animate-spin]="processing()"
          />
          {{ processing() ? 'Processing…' : 'Process payroll' }}
        </button>
      }
    </app-page-header>

    @if (run.error()) {
      <div class="card">
        <app-empty-state
          variant="error"
          title="Couldn't load payroll"
          actionLabel="Retry"
          (action)="run.reload()"
        />
      </div>
    } @else {
      <section class="mb-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <app-stat-card
          label="Employees"
          [value]="entries().length"
          icon="users"
          [hint]="statusHint()"
        />
        <app-stat-card label="Gross payroll" [value]="compact(totals().gross)" icon="banknote" />
        <app-stat-card
          label="Deductions + LOP"
          [value]="compact(totals().deductions)"
          icon="circle-minus"
          [hint]="totals().lopDays + ' LOP days'"
        />
        <app-stat-card label="Net pay" [value]="compact(totals().net)" icon="wallet" />
      </section>

      @if (run.value(); as r) {
        @if (r.status === 'Draft') {
          <div
            class="mb-4 flex items-start gap-3 rounded-card border border-[var(--tc-warn-border)] bg-[var(--tc-warn-bg)] px-4 py-3 text-[13px] text-[var(--tc-warn-fg)]"
            role="status"
          >
            <svg lucideIcon="info" size="16" class="mt-0.5 shrink-0" />
            <p>
              This month is a <b>draft</b>. LOP is calculated from staff attendance to date and will
              be final when you process payroll.
            </p>
          </div>
        }
      }

      <div class="table-card">
        <div
          class="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3"
        >
          <p class="text-sm font-semibold">{{ monthLabel() }}</p>
          @if (run.value(); as r) {
            <div class="flex items-center gap-2 text-xs text-muted">
              <app-status-badge [status]="r.status" />
              @if (r.processedOn) {
                <span>on {{ r.processedOn | appDate }}</span>
              }
            </div>
          }
        </div>
        @if (run.isLoading()) {
          <app-table-skeleton [rows]="8" [cols]="7" />
        } @else {
          <p-table
            [value]="entries()"
            dataKey="employeeId"
            [rowHover]="true"
            [scrollable]="true"
            scrollHeight="60vh"
            [tableStyle]="{ 'min-width': '1000px' }"
            sortField="employeeName"
            [sortOrder]="1"
          >
            <ng-template #header>
              <tr>
                <th pSortableColumn="employeeName">Employee <p-sorticon field="employeeName" /></th>
                <th pSortableColumn="department">Department <p-sorticon field="department" /></th>
                <th class="text-right">Days</th>
                <th pSortableColumn="lopDays" class="text-right">
                  LOP <p-sorticon field="lopDays" />
                </th>
                <th pSortableColumn="gross" class="text-right">
                  Gross <p-sorticon field="gross" />
                </th>
                <th class="text-right">Deductions</th>
                <th class="text-right">LOP amount</th>
                <th pSortableColumn="netPay" class="text-right">
                  Net pay <p-sorticon field="netPay" />
                </th>
                <th class="w-24"><span class="sr-only">Payslip</span></th>
              </tr>
            </ng-template>
            <ng-template #body let-e>
              <tr>
                <td>
                  <p class="cell-primary">{{ e.employeeName }}</p>
                  <p class="cell-meta">{{ e.designation }}</p>
                </td>
                <td>{{ e.department }}</td>
                <td class="text-right tabular-nums">
                  {{ e.workingDays - e.lopDays }}/{{ e.workingDays }}
                </td>
                <td class="text-right tabular-nums" [class.text-red-700]="e.lopDays > 0">
                  {{ e.lopDays || '—' }}
                </td>
                <td class="text-right tabular-nums">{{ e.gross | inr }}</td>
                <td class="text-right tabular-nums">{{ e.deductions | inr }}</td>
                <td class="text-right tabular-nums">
                  {{ e.lopAmount ? (e.lopAmount | inr) : '—' }}
                </td>
                <td class="text-right font-semibold tabular-nums">{{ e.netPay | inr }}</td>
                <td class="text-right">
                  <a
                    [routerLink]="['/hr/payslip', e.employeeId, month()]"
                    class="btn btn-ghost btn-sm"
                    >Payslip</a
                  >
                </td>
              </tr>
            </ng-template>
            <ng-template #footer>
              <tr class="font-semibold">
                <td colspan="4">Total</td>
                <td class="text-right tabular-nums">{{ totals().gross | inr }}</td>
                <td class="text-right tabular-nums" colspan="2">{{ totals().deductions | inr }}</td>
                <td class="text-right tabular-nums">{{ totals().net | inr }}</td>
                <td></td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="9"><app-empty-state icon="banknote" title="No payroll entries" /></td>
              </tr>
            </ng-template>
          </p-table>
        }
      </div>
    }
  `,
})
export class PayrollPage {
  private readonly service = inject(PayrollService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly compact = formatInrCompact;
  protected readonly month = signal<MonthKey | null>(null);
  protected readonly processing = signal(false);

  protected readonly runs = rxResource({ stream: () => this.service.getRuns(), defaultValue: [] });
  protected readonly monthOptions = computed(() =>
    this.runs
      .value()
      .map((r) => ({
        label: `${formatMonth(r.month, true)}${r.status === 'Draft' ? ' · Draft' : ''}`,
        value: r.month,
      })),
  );
  protected readonly run = rxResource({
    params: () => this.month() ?? undefined,
    stream: ({ params }) => this.service.getRun(params),
  });
  protected readonly entries = computed<PayrollEntry[]>(() =>
    this.run.hasValue() ? (this.run.value()?.entries ?? []) : [],
  );
  protected readonly totals = computed(() => {
    const e = this.entries();
    return {
      gross: e.reduce((s, x) => s + x.gross, 0),
      deductions: e.reduce((s, x) => s + x.deductions + x.lopAmount, 0),
      net: e.reduce((s, x) => s + x.netPay, 0),
      lopDays: e.reduce((s, x) => s + x.lopDays, 0),
    };
  });
  protected readonly monthLabel = computed(() =>
    this.month() ? formatMonth(this.month()!, true) : '',
  );
  protected readonly statusHint = computed(() =>
    this.run.hasValue() ? (this.run.value()?.status ?? '') : '',
  );

  constructor() {
    effect(() => {
      const runs = this.runs.value();
      if (!this.month() && runs.length) this.month.set(runs[0].month);
    });
  }

  protected async process(): Promise<void> {
    const month = this.month();
    if (!month) return;
    const ok = await this.confirm.ask({
      header: `Process payroll for ${formatMonth(month, true)}?`,
      message: `Net pay of ₹${this.totals().net.toLocaleString('en-IN')} for ${this.entries().length} employees will be locked and payslips released.`,
      acceptLabel: 'Process payroll',
    });
    if (!ok) return;
    this.processing.set(true);
    this.service.processRun(month).subscribe(() => {
      this.processing.set(false);
      this.toast.success(
        'Payroll processed',
        `${formatMonth(month, true)} payslips are now available.`,
      );
      this.run.reload();
      this.runs.reload();
    });
  }

  protected exportCsv(): void {
    downloadCsv(
      `payroll-${this.month()}`,
      [
        { header: 'Employee ID', value: (e: PayrollEntry) => e.employeeId },
        { header: 'Employee', value: (e) => e.employeeName },
        { header: 'Department', value: (e) => e.department },
        { header: 'Working days', value: (e) => e.workingDays },
        { header: 'LOP days', value: (e) => e.lopDays },
        { header: 'Gross', value: (e) => e.gross },
        { header: 'Deductions', value: (e) => e.deductions },
        { header: 'LOP amount', value: (e) => e.lopAmount },
        { header: 'Net pay', value: (e) => e.netPay },
      ],
      this.entries(),
    );
  }
}
