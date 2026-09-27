import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { CallStats } from '../../../models';
import { COLORS, barDataset, cartesianOptions } from '../../../shared/charts/chart-theme';
import { DurationPipe } from '../../../shared/pipes/format.pipes';
import { downloadCsv } from '../../../shared/utils/csv.util';
import { addDays, parseIsoDate, todayIso } from '../../../shared/utils/date.util';
import { formatDuration } from '../../../shared/utils/format.util';
import { EmptyState } from '../../../shared/ui/empty-state';
import { Panel } from '../../../shared/ui/panel';
import { TableSkeleton } from '../../../shared/ui/table-skeleton';
import { ReportsService } from '../data-access/reports.service';
import { DateRangeFilter, rangeToIso } from '../ui/date-range-filter';
import { ReportSummary, SummaryItem } from '../ui/report-summary';

@Component({
  selector: 'app-sales-calls-report',
  imports: [
    LucideDynamicIcon,
    ChartModule,
    TableModule,
    Panel,
    EmptyState,
    TableSkeleton,
    ReportSummary,
    DateRangeFilter,
    DurationPipe,
  ],
  template: `
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <app-date-range-filter [(range)]="range" />
      <button type="button" class="btn btn-secondary" (click)="exportCsv()">
        <svg lucideIcon="download" size="15" /> Export CSV
      </button>
    </div>
    <app-report-summary [items]="summary()" />
    <app-panel class="mt-4" title="Calls by salesperson" subtitle="Answered vs missed">
      <div class="h-64">
        <p-chart
          type="bar"
          [data]="chart()"
          [options]="options"
          height="100%"
          ariaLabel="Calls by salesperson"
        />
      </div>
    </app-panel>
    <div class="table-card mt-4">
      @if (stats.isLoading()) {
        <app-table-skeleton [rows]="4" [cols]="6" />
      } @else {
        <p-table [value]="list()" [scrollable]="true" [tableStyle]="{ 'min-width': '800px' }">
          <ng-template #header>
            <tr>
              <th>Salesperson</th>
              <th>Total</th>
              <th>Answered</th>
              <th>Missed</th>
              <th>Answer rate</th>
              <th>Incoming / outgoing</th>
              <th>Avg. duration</th>
              <th>Talk time</th>
            </tr>
          </ng-template>
          <ng-template #body let-s>
            <tr>
              <td class="cell-primary">{{ s.salespersonName }}</td>
              <td class="tabular-nums">{{ s.total }}</td>
              <td class="tabular-nums">{{ s.answered }}</td>
              <td class="tabular-nums">{{ s.missed }}</td>
              <td class="tabular-nums">
                {{ s.total ? ((s.answered / s.total) * 100).toFixed(0) : 0 }}%
              </td>
              <td class="tabular-nums">{{ s.incoming }} / {{ s.outgoing }}</td>
              <td class="tabular-nums">{{ s.avgDurationSec | duration }}</td>
              <td class="tabular-nums">{{ s.talkTimeSec | duration }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage
            ><tr>
              <td colspan="8">
                <app-empty-state icon="phone" title="No calls in this range" />
              </td></tr
          ></ng-template>
        </p-table>
      }
    </div>
  `,
})
export class SalesCallsReport {
  private readonly service = inject(ReportsService);
  protected readonly range = signal<Date[] | null>([
    parseIsoDate(addDays(todayIso(), -29)),
    parseIsoDate(todayIso()),
  ]);
  protected readonly options = cartesianOptions('number', { stacked: true, legend: true });
  protected readonly stats = rxResource({
    params: () => rangeToIso(this.range()),
    stream: ({ params }) => this.service.salesCalls(params),
    defaultValue: [],
  });
  protected readonly list = computed(() => (this.stats.hasValue() ? this.stats.value() : []));
  protected readonly summary = computed<SummaryItem[]>(() => {
    const l = this.list();
    const total = l.reduce((s, x) => s + x.total, 0);
    const answered = l.reduce((s, x) => s + x.answered, 0);
    const talk = l.reduce((s, x) => s + x.talkTimeSec, 0);
    return [
      { label: 'Total calls', value: total },
      {
        label: 'Answer rate',
        value: `${total ? Math.round((answered / total) * 100) : 0}%`,
        hint: `${answered} answered`,
      },
      { label: 'Missed', value: total - answered },
      { label: 'Talk time', value: formatDuration(talk) },
    ];
  });
  protected readonly chart = computed(() => ({
    labels: this.list().map((s) => s.salespersonName),
    datasets: [
      barDataset(
        'Answered',
        this.list().map((s) => s.answered),
        COLORS.emerald,
      ),
      barDataset(
        'Missed',
        this.list().map((s) => s.missed),
        COLORS.roseSoft,
      ),
    ],
  }));

  protected exportCsv(): void {
    downloadCsv(
      'sales-calls-report',
      [
        { header: 'Salesperson', value: (s: CallStats) => s.salespersonName },
        { header: 'Total', value: (s) => s.total },
        { header: 'Answered', value: (s) => s.answered },
        { header: 'Missed', value: (s) => s.missed },
        { header: 'Incoming', value: (s) => s.incoming },
        { header: 'Outgoing', value: (s) => s.outgoing },
        { header: 'Avg duration (sec)', value: (s) => s.avgDurationSec },
        { header: 'Talk time (sec)', value: (s) => s.talkTimeSec },
      ],
      this.list(),
    );
  }
}
