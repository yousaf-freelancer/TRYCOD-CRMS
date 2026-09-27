import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { StudentListItem } from '../../../models';
import { COLORS, cartesianOptions, lineDataset } from '../../../shared/charts/chart-theme';
import { downloadCsv } from '../../../shared/utils/csv.util';
import { EmptyState } from '../../../shared/ui/empty-state';
import { Meter } from '../../../shared/ui/meter';
import { Panel } from '../../../shared/ui/panel';
import { TableSkeleton } from '../../../shared/ui/table-skeleton';
import { CoursesService } from '../../courses/data-access/courses.service';
import { ReportsService } from '../data-access/reports.service';
import { ReportSummary, SummaryItem } from '../ui/report-summary';

@Component({
  selector: 'app-student-attendance-report',
  imports: [
    FormsModule,
    LucideDynamicIcon,
    ChartModule,
    SelectModule,
    TableModule,
    Panel,
    Meter,
    EmptyState,
    TableSkeleton,
    ReportSummary,
  ],
  template: `
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p-select
        [options]="batchOptions()"
        optionLabel="label"
        optionValue="value"
        [(ngModel)]="batchId"
        placeholder="All ongoing batches"
        [showClear]="true"
        class="!w-72"
        ariaLabel="Batch"
      />
      <button type="button" class="btn btn-secondary" (click)="exportCsv()">
        <svg lucideIcon="download" size="15" /> Export CSV
      </button>
    </div>
    <app-report-summary [items]="summary()" />
    <app-panel class="mt-4" title="Daily attendance" subtitle="Last 30 days">
      <div class="h-64">
        <p-chart
          type="line"
          [data]="chart()"
          [options]="options"
          height="100%"
          ariaLabel="Attendance trend"
        />
      </div>
    </app-panel>
    <div class="table-card mt-4">
      @if (data.isLoading()) {
        <app-table-skeleton [rows]="6" [cols]="4" />
      } @else {
        <p-table
          [value]="students()"
          [paginator]="true"
          [rows]="15"
          [scrollable]="true"
          [tableStyle]="{ 'min-width': '720px' }"
          sortField="attendancePct"
          [sortOrder]="1"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="name">Student <p-sorticon field="name" /></th>
              <th pSortableColumn="batchCode">Batch <p-sorticon field="batchCode" /></th>
              <th pSortableColumn="mentorName">Mentor <p-sorticon field="mentorName" /></th>
              <th pSortableColumn="attendancePct" class="w-56">
                Attendance <p-sorticon field="attendancePct" />
              </th>
            </tr>
          </ng-template>
          <ng-template #body let-s>
            <tr>
              <td class="cell-primary">{{ s.name }}</td>
              <td class="mono">{{ s.batchCode }}</td>
              <td>{{ s.mentorName }}</td>
              <td><app-meter [value]="s.attendancePct" ariaLabel="Attendance" /></td>
            </tr>
          </ng-template>
          <ng-template #emptymessage
            ><tr>
              <td colspan="4">
                <app-empty-state icon="calendar-x" title="No attendance data" />
              </td></tr
          ></ng-template>
        </p-table>
      }
    </div>
  `,
})
export class StudentAttendanceReport {
  private readonly service = inject(ReportsService);
  private readonly courses = inject(CoursesService);
  protected readonly batchId = signal<string | null>(null);
  protected readonly options = cartesianOptions('percent', { min: 50, max: 100 });

  private readonly batches = rxResource({
    stream: () => this.courses.getBatches({ status: 'Ongoing' }),
    defaultValue: [],
  });
  protected readonly batchOptions = computed(() =>
    this.batches.value().map((b) => ({ label: `${b.code} · ${b.courseName}`, value: b.id })),
  );
  protected readonly data = rxResource({
    params: () => ({ batchId: this.batchId() }),
    stream: ({ params }) => this.service.studentAttendance(params.batchId),
  });
  private readonly value = computed(() => (this.data.hasValue() ? this.data.value() : undefined));
  protected readonly students = computed(() =>
    (this.value()?.students ?? []).filter((s) => s.attendancePct > 0),
  );

  protected readonly summary = computed<SummaryItem[]>(() => {
    const s = this.students();
    const avg = s.length
      ? Math.round((s.reduce((t, x) => t + x.attendancePct, 0) / s.length) * 10) / 10
      : 0;
    const trend = this.value()?.trend ?? [];
    return [
      { label: 'Average attendance', value: `${avg}%` },
      { label: 'Students tracked', value: s.length },
      {
        label: 'Below 75%',
        value: s.filter((x) => x.attendancePct < 75).length,
        hint: 'need follow-up',
      },
      {
        label: 'Latest day',
        value: trend.length ? `${trend[trend.length - 1].value}%` : '—',
        hint: trend.length ? trend[trend.length - 1].label : undefined,
      },
    ];
  });
  protected readonly chart = computed(() => {
    const t = this.value()?.trend ?? [];
    return {
      labels: t.map((x) => x.label),
      datasets: [
        lineDataset(
          'Attendance %',
          t.map((x) => x.value),
          COLORS.emerald,
        ),
      ],
    };
  });

  protected exportCsv(): void {
    downloadCsv(
      'student-attendance-report',
      [
        { header: 'Student', value: (s: StudentListItem) => s.name },
        { header: 'Student ID', value: (s) => s.id },
        { header: 'Batch', value: (s) => s.batchCode },
        { header: 'Mentor', value: (s) => s.mentorName },
        { header: 'Attendance %', value: (s) => s.attendancePct },
      ],
      this.students(),
    );
  }
}
