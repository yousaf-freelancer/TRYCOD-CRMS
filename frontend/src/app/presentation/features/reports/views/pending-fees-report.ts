import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DueItem } from '../../../../domain/models';
import { COLORS, barDataset, cartesianOptions } from '../../../../shared/charts/chart-theme';
import { AppDatePipe, InrPipe } from '../../../../shared/pipes/format.pipes';
import { downloadCsv } from '../../../../shared/utils/csv.util';
import { formatInr } from '../../../../shared/utils/format.util';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { Panel } from '../../../../shared/ui/panel';
import { StatusBadge } from '../../../../shared/ui/status-badge';
import { TableSkeleton } from '../../../../shared/ui/table-skeleton';
import { ReportsService } from '../../../../data/services/reports.service';
import { ReportSummary, SummaryItem } from '../ui/report-summary';

@Component({
  selector: 'app-pending-fees-report',
  imports: [
    FormsModule,
    LucideDynamicIcon,
    ChartModule,
    SelectModule,
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
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap gap-2">
        <p-select
          [options]="courseOptions()"
          [(ngModel)]="course"
          placeholder="All courses"
          [showClear]="true"
          class="!w-52"
          ariaLabel="Course"
        />
        <p-select
          [options]="batchOptions()"
          [(ngModel)]="batch"
          placeholder="All batches"
          [showClear]="true"
          class="!w-40"
          ariaLabel="Batch"
        />
      </div>
      <button type="button" class="btn btn-secondary" (click)="exportCsv()">
        <svg lucideIcon="download" size="15" /> Export CSV
      </button>
    </div>
    <app-report-summary [items]="summary()" />
    <app-panel class="mt-4" title="Outstanding by course" subtitle="Overdue vs not yet due">
      <div class="h-64">
        <p-chart
          type="bar"
          [data]="chart()"
          [options]="options"
          height="100%"
          ariaLabel="Outstanding by course"
        />
      </div>
    </app-panel>
    <div class="table-card mt-4">
      @if (dues.isLoading()) {
        <app-table-skeleton [rows]="6" [cols]="6" />
      } @else {
        <p-table
          [value]="list()"
          [paginator]="true"
          [rows]="10"
          [scrollable]="true"
          [tableStyle]="{ 'min-width': '860px' }"
          sortField="daysOverdue"
          [sortOrder]="-1"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="studentName">Student <p-sorticon field="studentName" /></th>
              <th>Course</th>
              <th>Batch</th>
              <th pSortableColumn="dueDate">Due <p-sorticon field="dueDate" /></th>
              <th pSortableColumn="daysOverdue">Overdue <p-sorticon field="daysOverdue" /></th>
              <th pSortableColumn="balance" class="text-right">
                Balance <p-sorticon field="balance" />
              </th>
              <th>Status</th>
            </tr>
          </ng-template>
          <ng-template #body let-d>
            <tr>
              <td>
                <p class="cell-primary">{{ d.studentName }}</p>
                <p class="cell-meta">{{ d.phone }}</p>
              </td>
              <td>{{ d.courseName }}</td>
              <td class="mono">{{ d.batchCode }}</td>
              <td>{{ d.dueDate | appDate }}</td>
              <td class="tabular-nums">{{ d.daysOverdue ? d.daysOverdue + ' days' : '—' }}</td>
              <td class="text-right font-medium tabular-nums">{{ d.balance | inr }}</td>
              <td><app-status-badge [status]="d.status" /></td>
            </tr>
          </ng-template>
          <ng-template #emptymessage
            ><tr>
              <td colspan="7">
                <app-empty-state icon="circle-check" title="No pending fees" />
              </td></tr
          ></ng-template>
        </p-table>
      }
    </div>
  `,
})
export class PendingFeesReport {
  private readonly service = inject(ReportsService);
  protected readonly course = signal<string | null>(null);
  protected readonly batch = signal<string | null>(null);
  protected readonly options = cartesianOptions('inr', {
    stacked: true,
    legend: true,
    horizontal: true,
  });

  protected readonly dues = rxResource({
    stream: () => this.service.pendingFees(),
    defaultValue: [],
  });
  private readonly all = computed(() => (this.dues.hasValue() ? this.dues.value() : []));
  protected readonly courseOptions = computed(() =>
    [...new Set(this.all().map((d) => d.courseName))].sort(),
  );
  protected readonly batchOptions = computed(() =>
    [
      ...new Set(
        this.all()
          .filter((d) => !this.course() || d.courseName === this.course())
          .map((d) => d.batchCode),
      ),
    ].sort(),
  );
  protected readonly list = computed(() =>
    this.all().filter(
      (d) =>
        (!this.course() || d.courseName === this.course()) &&
        (!this.batch() || d.batchCode === this.batch()),
    ),
  );

  protected readonly summary = computed<SummaryItem[]>(() => {
    const l = this.list();
    const overdue = l.filter((d) => d.status === 'Overdue');
    return [
      {
        label: 'Outstanding',
        value: formatInr(l.reduce((s, d) => s + d.balance, 0)),
        hint: `${l.length} installments`,
      },
      {
        label: 'Overdue',
        value: formatInr(overdue.reduce((s, d) => s + d.balance, 0)),
        hint: `${overdue.length} installments`,
      },
      { label: 'Students with dues', value: new Set(l.map((d) => d.studentId)).size },
      {
        label: 'Avg. days overdue',
        value: overdue.length
          ? Math.round(overdue.reduce((s, d) => s + d.daysOverdue, 0) / overdue.length)
          : 0,
      },
    ];
  });
  protected readonly chart = computed(() => {
    const courses = [...new Set(this.list().map((d) => d.courseName))];
    const sum = (c: string, overdue: boolean) =>
      this.list()
        .filter((d) => d.courseName === c && (d.status === 'Overdue') === overdue)
        .reduce((s, d) => s + d.balance, 0);
    return {
      labels: courses,
      datasets: [
        barDataset(
          'Overdue',
          courses.map((c) => sum(c, true)),
          COLORS.rose,
        ),
        barDataset(
          'Not yet due',
          courses.map((c) => sum(c, false)),
          COLORS.amberSoft,
        ),
      ],
    };
  });

  protected exportCsv(): void {
    downloadCsv(
      'pending-fees-report',
      [
        { header: 'Student', value: (d: DueItem) => d.studentName },
        { header: 'Phone', value: (d) => d.phone },
        { header: 'Course', value: (d) => d.courseName },
        { header: 'Batch', value: (d) => d.batchCode },
        { header: 'Installment', value: (d) => d.installmentNo },
        { header: 'Due date', value: (d) => d.dueDate },
        { header: 'Days overdue', value: (d) => d.daysOverdue },
        { header: 'Balance', value: (d) => d.balance },
        { header: 'Status', value: (d) => d.status },
      ],
      this.list(),
    );
  }
}
