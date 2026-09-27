import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { ChartModule } from 'primeng/chart';
import { AuthService } from '../../../core/auth/auth.service';
import { COLORS, barDataset, cartesianOptions } from '../../../shared/charts/chart-theme';
import { AppDatePipe, DurationPipe } from '../../../shared/pipes/format.pipes';
import { dayLabel, formatTime, greeting, longToday } from '../../../shared/utils/date.util';
import { formatDuration } from '../../../shared/utils/format.util';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { Panel } from '../../../shared/ui/panel';
import { StatCard } from '../../../shared/ui/stat-card';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { DashboardService } from '../data-access/dashboard.service';
import { DashboardSkeleton } from '../ui/dashboard-skeleton';

@Component({
  selector: 'app-sales-dashboard',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    ChartModule,
    PageHeader,
    StatCard,
    Panel,
    StatusBadge,
    EmptyState,
    DashboardSkeleton,
    AppDatePipe,
    DurationPipe,
  ],
  template: `
    <app-page-header
      [title]="greeting + ', ' + firstName()"
      [subtitle]="today + ' · Calls, leads and follow-ups.'"
    >
      <a routerLink="/calls" class="btn btn-secondary"
        ><svg lucideIcon="phone-call" size="16" /> Call log</a
      >
      <a routerLink="/admissions/leads" class="btn btn-primary"
        ><svg lucideIcon="user-plus" size="16" /> My leads</a
      >
    </app-page-header>

    @if (data.error()) {
      <div class="card">
        <app-empty-state
          variant="error"
          title="Couldn't load your dashboard"
          actionLabel="Retry"
          (action)="data.reload()"
        />
      </div>
    } @else if (data.value(); as d) {
      <section class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Key metrics">
        <app-stat-card
          [label]="dayLabel(d.asOf) === 'Today' ? 'Calls today' : 'Calls · ' + dayLabel(d.asOf)"
          [value]="d.callsToday"
          icon="phone"
          [hint]="'Talk time ' + duration(d.talkTimeToday)"
        />
        <app-stat-card
          label="Answered"
          [value]="d.answeredToday"
          icon="phone-incoming"
          [change]="answerRate() + '%'"
          trend="up"
          hint="answer rate"
        />
        <app-stat-card
          label="Missed"
          [value]="d.missedToday"
          icon="phone-missed"
          [hint]="d.missedToday ? 'call back soon' : 'none missed'"
        />
        <app-stat-card
          label="Follow-ups due"
          [value]="d.followUpsDue.length"
          icon="phone-forwarded"
          [hint]="d.myLeadsCount + ' open leads'"
        />
      </section>

      <section class="mt-4 grid gap-4 lg:grid-cols-3">
        <app-panel class="lg:col-span-2" title="Answered vs missed" subtitle="Last 7 working days">
          <div class="h-64">
            <p-chart
              type="bar"
              [data]="weekChart()"
              [options]="stackedOptions"
              height="100%"
              ariaLabel="Answered versus missed calls"
            />
          </div>
        </app-panel>
        <app-panel title="Calls by hour" [subtitle]="dayLabel(d.asOf)">
          <div class="h-64">
            <p-chart
              type="bar"
              [data]="hourChart()"
              [options]="hourOptions"
              height="100%"
              ariaLabel="Calls by hour today"
            />
          </div>
        </app-panel>
      </section>

      <section class="mt-4 grid gap-4 lg:grid-cols-2">
        <app-panel title="Follow-ups due" subtitle="Today and overdue" [padded]="false">
          <a panel-actions routerLink="/admissions/follow-ups" class="btn btn-ghost btn-sm">Open</a>
          @if (d.followUpsDue.length) {
            <ul class="divide-y divide-neutral-100">
              @for (f of d.followUpsDue.slice(0, 7); track f.id) {
                <li class="flex items-center gap-3 px-5 py-3">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-[13px] font-medium">{{ f.name }}</p>
                    <p class="truncate text-xs text-muted">{{ f.phone }} · {{ f.courseName }}</p>
                  </div>
                  <span class="text-xs text-muted tabular-nums">{{
                    f.bucket === 'Today' ? time(f.dueTime) : (f.dueDate | appDate: 'dayMonth')
                  }}</span>
                  <app-status-badge [status]="f.bucket" />
                </li>
              }
            </ul>
          } @else {
            <app-empty-state icon="circle-check" title="No follow-ups due" />
          }
        </app-panel>

        <app-panel
          title="My open leads"
          [subtitle]="d.myLeadsCount + ' leads in progress'"
          [padded]="false"
        >
          <a panel-actions routerLink="/admissions/leads" class="btn btn-ghost btn-sm">All leads</a>
          @if (d.myLeads.length) {
            <ul class="divide-y divide-neutral-100">
              @for (l of d.myLeads; track l.id) {
                <li class="flex items-center gap-3 px-5 py-3">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-[13px] font-medium">{{ l.name }}</p>
                    <p class="truncate text-xs text-muted">{{ l.courseName }} · {{ l.source }}</p>
                  </div>
                  <app-status-badge [status]="l.status" />
                </li>
              }
            </ul>
          } @else {
            <app-empty-state icon="user-plus" title="No open leads" />
          }
        </app-panel>
      </section>

      @if (d.stats; as s) {
        <app-panel class="mt-4" title="This month" subtitle="Your call performance">
          <dl class="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div>
              <dt class="text-xs text-muted">Total calls</dt>
              <dd class="text-lg font-semibold tabular-nums">{{ s.total }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted">Answered</dt>
              <dd class="text-lg font-semibold tabular-nums">{{ s.answered }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted">Missed</dt>
              <dd class="text-lg font-semibold tabular-nums">{{ s.missed }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted">Avg. duration</dt>
              <dd class="text-lg font-semibold tabular-nums">{{ s.avgDurationSec | duration }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted">Talk time</dt>
              <dd class="text-lg font-semibold tabular-nums">{{ s.talkTimeSec | duration }}</dd>
            </div>
          </dl>
        </app-panel>
      }
    } @else {
      <app-dashboard-skeleton [cards]="4" />
    }
  `,
})
export class SalesDashboardView {
  private readonly service = inject(DashboardService);
  private readonly auth = inject(AuthService);

  protected readonly data = rxResource({
    params: () => this.auth.user()?.employeeId ?? '',
    stream: ({ params }) => this.service.getSales(params),
  });
  protected readonly greeting = greeting();
  protected readonly today = longToday();
  protected readonly time = formatTime;
  protected readonly dayLabel = dayLabel;
  protected readonly duration = formatDuration;
  protected readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');
  protected readonly stackedOptions = cartesianOptions('number', { stacked: true, legend: true });
  protected readonly hourOptions = cartesianOptions('number');

  private readonly value = computed(() => (this.data.hasValue() ? this.data.value() : undefined));
  protected readonly answerRate = computed(() => {
    const d = this.value();
    return d && d.callsToday ? Math.round((d.answeredToday / d.callsToday) * 100) : 0;
  });
  protected readonly weekChart = computed(() => {
    const rows = this.value()?.weekTrend ?? [];
    return {
      labels: rows.map((r) => r.label),
      datasets: [
        barDataset(
          'Answered',
          rows.map((r) => r.answered),
          COLORS.emerald,
        ),
        barDataset(
          'Missed',
          rows.map((r) => r.missed),
          COLORS.roseSoft,
        ),
      ],
    };
  });
  protected readonly hourChart = computed(() => {
    const rows = this.value()?.callsByHour ?? [];
    return {
      labels: rows.map((r) => r.label),
      datasets: [
        barDataset(
          'Calls',
          rows.map((r) => r.value),
        ),
      ],
    };
  });
}
