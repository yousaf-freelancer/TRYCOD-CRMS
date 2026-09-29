import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { COLORS, barDataset, cartesianOptions } from '../../../../shared/charts/chart-theme';
import { downloadCsv } from '../../../../shared/utils/csv.util';
import { formatDate } from '../../../../shared/utils/date.util';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { Panel } from '../../../../shared/ui/panel';
import { TableSkeleton } from '../../../../shared/ui/table-skeleton';
import { ReportsService } from '../../../../data/services/reports.service';
import { ReportSummary, SummaryItem } from '../ui/report-summary';

interface BatchRow {
  batchCode: string;
  mentorName: string;
  submitted: number;
  pending: number;
  avgRating: number;
}

@Component({
  selector: 'app-mentor-reports-report',
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
  ],
  template: `
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p-select
        [options]="weekOptions"
        optionLabel="label"
        optionValue="value"
        [(ngModel)]="week"
        class="!w-60"
        ariaLabel="Week"
      />
      <button type="button" class="btn btn-secondary" (click)="exportCsv()">
        <svg lucideIcon="download" size="15" /> Export CSV
      </button>
    </div>
    <app-report-summary [items]="summary()" />
    <app-panel class="mt-4" title="Progress rating distribution">
      <div class="h-56">
        <p-chart
          type="bar"
          [data]="chart()"
          [options]="options"
          height="100%"
          ariaLabel="Rating distribution"
        />
      </div>
    </app-panel>
    <div class="table-card mt-4">
      @if (data.isLoading()) {
        <app-table-skeleton [rows]="6" [cols]="5" />
      } @else {
        <p-table [value]="rows()" [scrollable]="true" [tableStyle]="{ 'min-width': '720px' }">
          <ng-template #header>
            <tr>
              <th>Batch</th>
              <th>Mentor</th>
              <th>Submitted</th>
              <th>Pending</th>
              <th>Avg. rating</th>
            </tr>
          </ng-template>
          <ng-template #body let-r>
            <tr>
              <td class="mono font-medium">{{ r.batchCode }}</td>
              <td>{{ r.mentorName }}</td>
              <td class="tabular-nums">{{ r.submitted }}</td>
              <td class="tabular-nums" [class.text-red-700]="r.pending > 0">{{ r.pending }}</td>
              <td class="tabular-nums">{{ r.avgRating ? r.avgRating.toFixed(1) : '—' }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage
            ><tr>
              <td colspan="5">
                <app-empty-state icon="clipboard-list" title="No reports for this week" />
              </td></tr
          ></ng-template>
        </p-table>
      }
    </div>
  `,
})
export class MentorReportsReport {
  private readonly service = inject(ReportsService);
  protected readonly weekOptions = this.service
    .recentWeeks(8)
    .map((w) => ({ label: `Week of ${formatDate(w)}`, value: w }));
  protected readonly week = signal(this.weekOptions[0].value);
  protected readonly options = cartesianOptions('number');

  protected readonly data = rxResource({
    params: () => this.week(),
    stream: ({ params }) => this.service.mentorReportsReport(params),
  });
  private readonly value = computed(() => (this.data.hasValue() ? this.data.value() : undefined));

  protected readonly rows = computed<BatchRow[]>(() => {
    const reports = this.value()?.reports ?? [];
    const pending = (this.value()?.pending ?? []).filter((p) => p.weekStart === this.week());
    const byBatch = new Map<string, BatchRow>();
    reports.forEach((r) => {
      const row = byBatch.get(r.batchCode) ?? {
        batchCode: r.batchCode,
        mentorName: r.mentorName,
        submitted: 0,
        pending: 0,
        avgRating: 0,
      };
      row.avgRating = (row.avgRating * row.submitted + r.progressRating) / (row.submitted + 1);
      row.submitted++;
      byBatch.set(r.batchCode, row);
    });
    pending.forEach((p) => {
      const row = byBatch.get(p.batchCode) ?? {
        batchCode: p.batchCode,
        mentorName: p.mentorName,
        submitted: 0,
        pending: 0,
        avgRating: 0,
      };
      row.pending = p.pendingCount;
      byBatch.set(p.batchCode, row);
    });
    return [...byBatch.values()].sort(
      (a, b) => b.pending - a.pending || a.batchCode.localeCompare(b.batchCode),
    );
  });

  protected readonly summary = computed<SummaryItem[]>(() => {
    const reports = this.value()?.reports ?? [];
    const pending = this.rows().reduce((s, r) => s + r.pending, 0);
    const avg = reports.length
      ? reports.reduce((s, r) => s + r.progressRating, 0) / reports.length
      : 0;
    return [
      { label: 'Reports submitted', value: reports.length },
      { label: 'Pending', value: pending, hint: pending ? 'follow up with mentors' : 'all done' },
      { label: 'Average rating', value: avg ? avg.toFixed(1) + ' / 5' : '—' },
      {
        label: 'Needs attention (≤2)',
        value: reports.filter((r) => r.progressRating <= 2).length,
        hint: 'students',
      },
    ];
  });

  protected readonly chart = computed(() => {
    const reports = this.value()?.reports ?? [];
    const labels = [
      '1 · Needs attention',
      '2 · Below',
      '3 · On track',
      '4 · Good',
      '5 · Excellent',
    ];
    return {
      labels,
      datasets: [
        barDataset(
          'Students',
          [1, 2, 3, 4, 5].map((n) => reports.filter((r) => r.progressRating === n).length),
          [COLORS.rose, COLORS.orange, COLORS.amber, COLORS.sky, COLORS.emerald],
        ),
      ],
    };
  });

  protected exportCsv(): void {
    downloadCsv(
      `mentor-reports-${this.week()}`,
      [
        { header: 'Batch', value: (r: BatchRow) => r.batchCode },
        { header: 'Mentor', value: (r) => r.mentorName },
        { header: 'Submitted', value: (r) => r.submitted },
        { header: 'Pending', value: (r) => r.pending },
        { header: 'Average rating', value: (r) => r.avgRating.toFixed(2) },
      ],
      this.rows(),
    );
  }
}
