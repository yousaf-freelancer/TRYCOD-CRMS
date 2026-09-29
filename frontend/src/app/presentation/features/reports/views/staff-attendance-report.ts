import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { StaffMonthlySummary } from '../../../../domain/models';
import { COLORS, barDataset, cartesianOptions } from '../../../../shared/charts/chart-theme';
import { DurationPipe } from '../../../../shared/pipes/format.pipes';
import { downloadCsv } from '../../../../shared/utils/csv.util';
import { monthKeyOf, parseIsoDate, toIsoDate, todayIso } from '../../../../shared/utils/date.util';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { Meter } from '../../../../shared/ui/meter';
import { Panel } from '../../../../shared/ui/panel';
import { TableSkeleton } from '../../../../shared/ui/table-skeleton';
import { ReportsService } from '../../../../data/services/reports.service';
import { ReportSummary, SummaryItem } from '../ui/report-summary';

@Component({
  selector: 'app-staff-attendance-report',
  imports: [
    FormsModule,
    LucideDynamicIcon,
    ChartModule,
    DatePickerModule,
    TableModule,
    Panel,
    Meter,
    EmptyState,
    TableSkeleton,
    ReportSummary,
    DurationPipe,
  ],
  template: `
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p-datepicker
        [(ngModel)]="month"
        view="month"
        dateFormat="MM yy"
        [maxDate]="today"
        [readonlyInput]="true"
        [showIcon]="true"
        iconDisplay="input"
        class="!w-52"
        inputId="sar-month"
        ariaLabel="Month"
        appendTo="body"
      />
      <button type="button" class="btn btn-secondary" (click)="exportCsv()">
        <svg lucideIcon="download" size="15" /> Export CSV
      </button>
    </div>
    <app-report-summary [items]="summary()" />
    <app-panel class="mt-4" title="Attendance % by employee">
      <div class="h-72">
        <p-chart
          type="bar"
          [data]="chart()"
          [options]="options"
          height="100%"
          ariaLabel="Staff attendance"
        />
      </div>
    </app-panel>
    <div class="table-card mt-4">
      @if (data.isLoading()) {
        <app-table-skeleton [rows]="6" [cols]="6" />
      } @else {
        <p-table
          [value]="list()"
          [scrollable]="true"
          [tableStyle]="{ 'min-width': '860px' }"
          sortField="pct"
          [sortOrder]="1"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="employeeName">Employee <p-sorticon field="employeeName" /></th>
              <th>Days</th>
              <th>Present</th>
              <th>Late</th>
              <th>Absent</th>
              <th>Leave</th>
              <th>Avg. hours</th>
              <th pSortableColumn="pct" class="w-48">Attendance <p-sorticon field="pct" /></th>
            </tr>
          </ng-template>
          <ng-template #body let-s>
            <tr>
              <td>
                <p class="cell-primary">{{ s.employeeName }}</p>
                <p class="cell-meta">{{ s.department }}</p>
              </td>
              <td class="tabular-nums">{{ s.workingDays }}</td>
              <td class="tabular-nums">{{ s.present }}</td>
              <td class="tabular-nums">{{ s.late }}</td>
              <td class="tabular-nums">{{ s.absent }}</td>
              <td class="tabular-nums">{{ s.onLeave }}</td>
              <td class="tabular-nums">{{ s.avgMinutes | duration: 'minutes' }}</td>
              <td><app-meter [value]="s.pct" ariaLabel="Attendance" /></td>
            </tr>
          </ng-template>
          <ng-template #emptymessage
            ><tr>
              <td colspan="8">
                <app-empty-state icon="users" title="No records for this month" />
              </td></tr
          ></ng-template>
        </p-table>
      }
    </div>
  `,
})
export class StaffAttendanceReport {
  private readonly service = inject(ReportsService);
  protected readonly today = parseIsoDate(todayIso());
  protected readonly month = signal<Date>(parseIsoDate(todayIso()));
  protected readonly options = cartesianOptions('percent', { horizontal: true, min: 0, max: 100 });

  protected readonly data = rxResource({
    params: () => monthKeyOf(toIsoDate(this.month())),
    stream: ({ params }) => this.service.staffAttendance(params),
    defaultValue: [],
  });
  protected readonly list = computed(() => (this.data.hasValue() ? this.data.value() : []));
  protected readonly summary = computed<SummaryItem[]>(() => {
    const l = this.list();
    const avg = l.length ? Math.round((l.reduce((s, x) => s + x.pct, 0) / l.length) * 10) / 10 : 0;
    return [
      { label: 'Average attendance', value: `${avg}%` },
      { label: 'Late arrivals', value: l.reduce((s, x) => s + x.late, 0) },
      { label: 'Absences', value: l.reduce((s, x) => s + x.absent, 0), hint: 'LOP candidates' },
      { label: 'Leave days', value: l.reduce((s, x) => s + x.onLeave, 0) },
    ];
  });
  protected readonly chart = computed(() => {
    const l = [...this.list()].sort((a, b) => b.pct - a.pct);
    return {
      labels: l.map((x) => x.employeeName),
      datasets: [
        barDataset(
          'Attendance %',
          l.map((x) => x.pct),
          l.map((x) => (x.pct >= 90 ? COLORS.emerald : x.pct >= 75 ? COLORS.amber : COLORS.rose)),
        ),
      ],
    };
  });

  protected exportCsv(): void {
    downloadCsv(
      'staff-attendance-report',
      [
        { header: 'Employee', value: (s: StaffMonthlySummary) => s.employeeName },
        { header: 'Department', value: (s) => s.department },
        { header: 'Days', value: (s) => s.workingDays },
        { header: 'Present', value: (s) => s.present },
        { header: 'Late', value: (s) => s.late },
        { header: 'Half day', value: (s) => s.halfDay },
        { header: 'Absent', value: (s) => s.absent },
        { header: 'On leave', value: (s) => s.onLeave },
        { header: 'Attendance %', value: (s) => s.pct },
      ],
      this.list(),
    );
  }
}
