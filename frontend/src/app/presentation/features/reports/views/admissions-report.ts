import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { AdmissionView } from '../../../../domain/models';
import { SERIES, barDataset, cartesianOptions, doughnutOptions } from '../../../../shared/charts/chart-theme';
import { AppDatePipe, InrPipe } from '../../../../shared/pipes/format.pipes';
import { downloadCsv } from '../../../../shared/utils/csv.util';
import { addDays, parseIsoDate, todayIso } from '../../../../shared/utils/date.util';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { Panel } from '../../../../shared/ui/panel';
import { StatusBadge } from '../../../../shared/ui/status-badge';
import { TableSkeleton } from '../../../../shared/ui/table-skeleton';
import { ReportsService } from '../../../../data/services/reports.service';
import { DateRangeFilter, rangeToIso } from '../ui/date-range-filter';
import { ReportSummary, SummaryItem } from '../ui/report-summary';

@Component({
  selector: 'app-admissions-report',
  imports: [
    LucideDynamicIcon,
    ChartModule,
    TableModule,
    Panel,
    StatusBadge,
    EmptyState,
    TableSkeleton,
    ReportSummary,
    DateRangeFilter,
    InrPipe,
    AppDatePipe,
  ],
  template: `
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <app-date-range-filter [(range)]="range" />
      <button type="button" class="btn btn-secondary" (click)="exportCsv()">
        <svg lucideIcon="download" size="15" /> Export CSV
      </button>
    </div>
    @if (data.error()) {
      <div class="card">
        <app-empty-state
          variant="error"
          title="Couldn't build report"
          actionLabel="Retry"
          (action)="data.reload()"
        />
      </div>
    } @else {
      <app-report-summary [items]="summary()" />
      <section class="mt-4 grid gap-4 lg:grid-cols-3">
        <app-panel class="lg:col-span-2" title="Admissions by course">
          <div class="h-64">
            <p-chart
              type="bar"
              [data]="byCourse()"
              [options]="barOptions"
              height="100%"
              ariaLabel="Admissions by course"
            />
          </div>
        </app-panel>
        <app-panel title="Leads by source">
          <div class="h-64">
            <p-chart
              type="doughnut"
              [data]="bySource()"
              [options]="donut"
              height="100%"
              ariaLabel="Leads by source"
            />
          </div>
        </app-panel>
      </section>
      <div class="table-card mt-4">
        @if (data.isLoading()) {
          <app-table-skeleton [rows]="6" [cols]="6" />
        } @else {
          <p-table
            [value]="admissions()"
            [paginator]="true"
            [rows]="10"
            [scrollable]="true"
            [tableStyle]="{ 'min-width': '900px' }"
            sortField="admissionDate"
            [sortOrder]="-1"
          >
            <ng-template #header>
              <tr>
                <th pSortableColumn="admissionDate">Date <p-sorticon field="admissionDate" /></th>
                <th pSortableColumn="studentName">Student <p-sorticon field="studentName" /></th>
                <th pSortableColumn="courseName">Course <p-sorticon field="courseName" /></th>
                <th>Batch</th>
                <th pSortableColumn="advisorName">Advisor <p-sorticon field="advisorName" /></th>
                <th class="text-right">Net fee</th>
                <th>Status</th>
              </tr>
            </ng-template>
            <ng-template #body let-a>
              <tr>
                <td>{{ a.admissionDate | appDate }}</td>
                <td class="cell-primary">{{ a.studentName }}</td>
                <td>{{ a.courseName }}</td>
                <td class="mono">{{ a.batchCode }}</td>
                <td>{{ a.advisorName }}</td>
                <td class="text-right tabular-nums">{{ a.netFee | inr }}</td>
                <td><app-status-badge [status]="a.status" /></td>
              </tr>
            </ng-template>
            <ng-template #emptymessage
              ><tr>
                <td colspan="7">
                  <app-empty-state icon="user-check" title="No admissions in this range" />
                </td></tr
            ></ng-template>
          </p-table>
        }
      </div>
    }
  `,
})
export class AdmissionsReport {
  private readonly service = inject(ReportsService);
  protected readonly range = signal<Date[] | null>([
    parseIsoDate(addDays(todayIso(), -89)),
    parseIsoDate(todayIso()),
  ]);
  protected readonly barOptions = cartesianOptions('number');
  protected readonly donut = doughnutOptions();

  protected readonly data = rxResource({
    params: () => rangeToIso(this.range()),
    stream: ({ params }) => this.service.admissionsReport(params),
  });
  private readonly value = computed(() => (this.data.hasValue() ? this.data.value() : undefined));
  protected readonly admissions = computed(() => this.value()?.admissions ?? []);

  protected readonly summary = computed<SummaryItem[]>(() => {
    const f = this.value()?.funnel;
    const revenue = this.admissions().reduce(
      (s, a) => s + (a.status !== 'Cancelled' ? a.netFee : 0),
      0,
    );
    return [
      { label: 'Leads', value: f?.leads ?? '—' },
      {
        label: 'Enquiries',
        value: f?.enquiries ?? '—',
        hint: f?.leads ? `${Math.round((f.enquiries / f.leads) * 100)}% of leads` : undefined,
      },
      {
        label: 'Admissions',
        value: f?.admissions ?? '—',
        hint: f?.leads
          ? `${Math.round((f.admissions / f.leads) * 100)}% lead conversion`
          : undefined,
      },
      { label: 'Fee value booked', value: `₹${revenue.toLocaleString('en-IN')}` },
    ];
  });

  protected readonly byCourse = computed(() => {
    const counts = new Map<string, number>();
    this.admissions().forEach((a) => counts.set(a.courseName, (counts.get(a.courseName) ?? 0) + 1));
    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map((e) => e[0]),
      datasets: [
        barDataset(
          'Admissions',
          entries.map((e) => e[1]),
          entries.map((_, i) => SERIES[i % SERIES.length]),
        ),
      ],
    };
  });
  protected readonly bySource = computed(() => {
    const counts = new Map<string, number>();
    (this.value()?.leads ?? []).forEach((l) =>
      counts.set(l.source, (counts.get(l.source) ?? 0) + 1),
    );
    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map((e) => e[0]),
      datasets: [
        {
          data: entries.map((e) => e[1]),
          backgroundColor: entries.map((_, i) => SERIES[i % SERIES.length]),
          borderColor: '#fff',
          borderWidth: 2,
        },
      ],
    };
  });

  protected exportCsv(): void {
    downloadCsv(
      'admissions-report',
      [
        { header: 'Date', value: (a: AdmissionView) => a.admissionDate },
        { header: 'Admission ID', value: (a) => a.id },
        { header: 'Student', value: (a) => a.studentName },
        { header: 'Course', value: (a) => a.courseName },
        { header: 'Batch', value: (a) => a.batchCode },
        { header: 'Advisor', value: (a) => a.advisorName },
        { header: 'Fee plan', value: (a) => a.feePlan },
        { header: 'Net fee', value: (a) => a.netFee },
        { header: 'Status', value: (a) => a.status },
      ],
      this.admissions(),
    );
  }
}
