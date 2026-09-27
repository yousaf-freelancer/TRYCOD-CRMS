import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { PAYMENT_MODES, PaymentMode, PaymentView } from '../../../models';
import { SERIES, barDataset, cartesianOptions, lineDataset } from '../../../shared/charts/chart-theme';
import { AppDatePipe, InrPipe } from '../../../shared/pipes/format.pipes';
import { downloadCsv } from '../../../shared/utils/csv.util';
import { addDays, formatDayMonth, parseIsoDate, todayIso } from '../../../shared/utils/date.util';
import { formatInr } from '../../../shared/utils/format.util';
import { EmptyState } from '../../../shared/ui/empty-state';
import { Panel } from '../../../shared/ui/panel';
import { TableSkeleton } from '../../../shared/ui/table-skeleton';
import { CoursesService } from '../../courses/data-access/courses.service';
import { ReportsService } from '../data-access/reports.service';
import { DateRangeFilter, rangeToIso } from '../ui/date-range-filter';
import { ReportSummary, SummaryItem } from '../ui/report-summary';

@Component({
  selector: 'app-fee-collection-report',
  imports: [
    FormsModule,
    LucideDynamicIcon,
    ChartModule,
    SelectModule,
    TableModule,
    Panel,
    EmptyState,
    TableSkeleton,
    ReportSummary,
    DateRangeFilter,
    InrPipe,
    AppDatePipe,
  ],
  template: `
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <app-date-range-filter [(range)]="range" />
        <p-select
          [options]="courses.value()"
          optionLabel="name"
          optionValue="id"
          [(ngModel)]="courseId"
          placeholder="All courses"
          [showClear]="true"
          class="!w-44"
          ariaLabel="Course"
        />
        <p-select
          [options]="modes"
          [(ngModel)]="mode"
          placeholder="All modes"
          [showClear]="true"
          class="!w-36"
          ariaLabel="Mode"
        />
      </div>
      <button type="button" class="btn btn-secondary" (click)="exportCsv()">
        <svg lucideIcon="download" size="15" /> Export CSV
      </button>
    </div>
    <app-report-summary [items]="summary()" />
    <section class="mt-4 grid gap-4 lg:grid-cols-3">
      <app-panel class="lg:col-span-2" title="Daily collection">
        <div class="h-64">
          <p-chart
            type="line"
            [data]="daily()"
            [options]="inr"
            height="100%"
            ariaLabel="Daily collection"
          />
        </div>
      </app-panel>
      <app-panel title="By payment mode">
        <div class="h-64">
          <p-chart
            type="bar"
            [data]="byMode()"
            [options]="inrH"
            height="100%"
            ariaLabel="Collection by mode"
          />
        </div>
      </app-panel>
    </section>
    <div class="table-card mt-4">
      @if (payments.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't build report"
          actionLabel="Retry"
          (action)="payments.reload()"
        />
      } @else if (payments.isLoading()) {
        <app-table-skeleton [rows]="6" [cols]="6" />
      } @else {
        <p-table
          [value]="list()"
          [paginator]="true"
          [rows]="10"
          [scrollable]="true"
          [tableStyle]="{ 'min-width': '860px' }"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="date">Date <p-sorticon field="date" /></th>
              <th>Receipt</th>
              <th pSortableColumn="studentName">Student <p-sorticon field="studentName" /></th>
              <th>Course</th>
              <th>Mode</th>
              <th>Collected by</th>
              <th pSortableColumn="amount" class="text-right">
                Amount <p-sorticon field="amount" />
              </th>
            </tr>
          </ng-template>
          <ng-template #body let-p>
            <tr>
              <td>{{ p.date | appDate }}</td>
              <td class="mono">{{ p.receiptNo }}</td>
              <td class="cell-primary">{{ p.studentName }}</td>
              <td>{{ p.courseName }}</td>
              <td>{{ p.mode }}</td>
              <td>{{ p.collectedByName }}</td>
              <td class="text-right font-medium tabular-nums">{{ p.amount | inr }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage
            ><tr>
              <td colspan="7">
                <app-empty-state icon="receipt" title="No collections in this range" />
              </td></tr
          ></ng-template>
        </p-table>
      }
    </div>
  `,
})
export class FeeCollectionReport {
  private readonly service = inject(ReportsService);
  private readonly coursesService = inject(CoursesService);
  protected readonly modes = [...PAYMENT_MODES];
  protected readonly range = signal<Date[] | null>([
    parseIsoDate(addDays(todayIso(), -29)),
    parseIsoDate(todayIso()),
  ]);
  protected readonly courseId = signal<string | null>(null);
  protected readonly mode = signal<PaymentMode | null>(null);
  protected readonly inr = cartesianOptions('inr');
  protected readonly inrH = cartesianOptions('inr', { horizontal: true });

  protected readonly courses = rxResource({
    stream: () => this.coursesService.getCourses(),
    defaultValue: [],
  });
  protected readonly payments = rxResource({
    params: () => ({ ...rangeToIso(this.range()), courseId: this.courseId(), mode: this.mode() }),
    stream: ({ params }) => this.service.feeCollection(params),
    defaultValue: [],
  });
  protected readonly list = computed(() => (this.payments.hasValue() ? this.payments.value() : []));

  protected readonly summary = computed<SummaryItem[]>(() => {
    const l = this.list();
    const total = l.reduce((s, p) => s + p.amount, 0);
    const students = new Set(l.map((p) => p.studentId)).size;
    const top = PAYMENT_MODES.map((m) => ({
      m,
      v: l.filter((p) => p.mode === m).reduce((s, p) => s + p.amount, 0),
    })).sort((a, b) => b.v - a.v)[0];
    return [
      { label: 'Total collected', value: formatInr(total) },
      { label: 'Receipts', value: l.length, hint: `${students} students` },
      { label: 'Average receipt', value: formatInr(l.length ? total / l.length : 0) },
      {
        label: 'Top mode',
        value: top && top.v ? top.m : '—',
        hint: top && total ? `${Math.round((top.v / total) * 100)}% of value` : undefined,
      },
    ];
  });
  protected readonly daily = computed(() => {
    const byDate = new Map<string, number>();
    [...this.list()]
      .reverse()
      .forEach((p) => byDate.set(p.date, (byDate.get(p.date) ?? 0) + p.amount));
    const entries = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return {
      labels: entries.map((e) => formatDayMonth(e[0])),
      datasets: [
        lineDataset(
          'Collected',
          entries.map((e) => e[1]),
        ),
      ],
    };
  });
  protected readonly byMode = computed(() => ({
    labels: [...PAYMENT_MODES],
    datasets: [
      barDataset(
        'Collected',
        PAYMENT_MODES.map((m) =>
          this.list()
            .filter((p) => p.mode === m)
            .reduce((s, p) => s + p.amount, 0),
        ),
        SERIES.slice(0, 4),
      ),
    ],
  }));

  protected exportCsv(): void {
    downloadCsv(
      'fee-collection-report',
      [
        { header: 'Date', value: (p: PaymentView) => p.date },
        { header: 'Receipt', value: (p) => p.receiptNo },
        { header: 'Student', value: (p) => p.studentName },
        { header: 'Course', value: (p) => p.courseName },
        { header: 'Mode', value: (p) => p.mode },
        { header: 'Reference', value: (p) => p.reference },
        { header: 'Collected by', value: (p) => p.collectedByName },
        { header: 'Amount', value: (p) => p.amount },
      ],
      this.list(),
    );
  }
}
