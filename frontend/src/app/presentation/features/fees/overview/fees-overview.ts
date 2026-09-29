import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { PAYMENT_MODES } from '../../../../domain/models';
import {
  COLORS,
  SERIES,
  barDataset,
  cartesianOptions,
  doughnutOptions,
} from '../../../../shared/charts/chart-theme';
import { AppDatePipe, InrPipe } from '../../../../shared/pipes/format.pipes';
import { currentMonthKey, todayIso } from '../../../../shared/utils/date.util';
import { formatInrCompact } from '../../../../shared/utils/format.util';
import { Avatar } from '../../../../shared/ui/avatar';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { Panel } from '../../../../shared/ui/panel';
import { StatCard } from '../../../../shared/ui/stat-card';
import { FeesService } from '../../../../data/services/fees.service';

@Component({
  selector: 'app-fees-overview',
  imports: [
    RouterLink,
    ChartModule,
    SkeletonModule,
    StatCard,
    Panel,
    Avatar,
    EmptyState,
    InrPipe,
    AppDatePipe,
  ],
  template: `
    @if (summary.error()) {
      <div class="card">
        <app-empty-state
          variant="error"
          title="Couldn't load fee summary"
          actionLabel="Retry"
          (action)="summary.reload()"
        />
      </div>
    } @else if (summary.value(); as s) {
      <section class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5" aria-label="Fee summary">
        <app-stat-card
          label="Collected today"
          [value]="compact(s.collectedToday)"
          icon="indian-rupee"
          [hint]="todayCount() + ' receipts'"
        />
        <app-stat-card
          label="Collected this month"
          [value]="compact(s.collectedMonth)"
          icon="wallet"
          [hint]="monthCount() + ' receipts'"
        />
        <app-stat-card
          label="Pending (all dues)"
          [value]="compact(s.pending)"
          icon="hourglass"
          hint="future + overdue"
        />
        <app-stat-card
          label="Overdue"
          [value]="compact(s.overdue)"
          icon="triangle-alert"
          [change]="s.overdueStudents + ' students'"
          trend="down"
        />
        <app-stat-card
          label="Students with dues"
          [value]="s.studentsWithDues"
          icon="users"
          hint="due within 30 days"
        />
      </section>
    } @else {
      <div class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        @for (i of [1, 2, 3, 4, 5]; track i) {
          <div class="card card-pad"><p-skeleton height="4.5rem" /></div>
        }
      </div>
    }

    <section class="mt-4 grid gap-4 lg:grid-cols-3">
      <app-panel class="lg:col-span-2" title="Monthly collection" subtitle="Last 7 months">
        <div class="h-64">
          <p-chart
            type="bar"
            [data]="trendChart()"
            [options]="trendOptions"
            height="100%"
            ariaLabel="Monthly collection"
          />
        </div>
      </app-panel>
      <app-panel title="Payment modes" subtitle="This month">
        <div class="h-64">
          <p-chart
            type="doughnut"
            [data]="modeChart()"
            [options]="donutOptions"
            height="100%"
            ariaLabel="Payment mode split"
          />
        </div>
      </app-panel>
    </section>

    <section class="mt-4 grid gap-4 xl:grid-cols-2">
      <app-panel title="Recent payments" [padded]="false">
        <a panel-actions routerLink="/fees/payments" class="btn btn-ghost btn-sm">All payments</a>
        <ul class="divide-y divide-neutral-100">
          @for (p of recent(); track p.id) {
            <li class="flex items-center gap-3 px-5 py-3">
              <app-avatar [name]="p.studentName" size="sm" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-[13px] font-medium">{{ p.studentName }}</p>
                <p class="truncate text-xs text-muted">
                  {{ p.receiptNo }} · {{ p.mode }} · {{ p.date | appDate }}
                </p>
              </div>
              <p class="text-[13px] font-semibold tabular-nums">{{ p.amount | inr }}</p>
              <a [routerLink]="['/fees/receipt', p.id]" class="btn btn-ghost btn-sm">Receipt</a>
            </li>
          }
        </ul>
      </app-panel>
      <app-panel title="Most overdue" [padded]="false">
        <a panel-actions routerLink="/fees/dues" class="btn btn-ghost btn-sm">All dues</a>
        <ul class="divide-y divide-neutral-100">
          @for (d of overdue(); track d.installmentId) {
            <li class="flex items-center gap-3 px-5 py-3">
              <app-avatar [name]="d.studentName" size="sm" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-[13px] font-medium">{{ d.studentName }}</p>
                <p class="truncate text-xs text-muted">
                  {{ d.batchCode }} · Inst. {{ d.installmentNo }} · {{ d.daysOverdue }} days overdue
                </p>
              </div>
              <p class="text-[13px] font-semibold tabular-nums">{{ d.balance | inr }}</p>
              <a
                [routerLink]="['/fees/collect']"
                [queryParams]="{ student: d.studentId }"
                class="btn btn-secondary btn-sm"
                >Collect</a
              >
            </li>
          } @empty {
            <li><app-empty-state icon="circle-check" title="Nothing overdue" /></li>
          }
        </ul>
      </app-panel>
    </section>
  `,
})
export class FeesOverview {
  private readonly service = inject(FeesService);
  protected readonly compact = formatInrCompact;
  protected readonly trendOptions = cartesianOptions('inr');
  protected readonly donutOptions = doughnutOptions();

  protected readonly summary = rxResource({ stream: () => this.service.getSummary() });
  private readonly trend = rxResource({
    stream: () => this.service.getMonthlyCollection(),
    defaultValue: [],
  });
  private readonly payments = rxResource({
    stream: () => this.service.getPayments(),
    defaultValue: [],
  });
  private readonly dues = rxResource({ stream: () => this.service.getDues(), defaultValue: [] });

  private readonly paymentList = computed(() =>
    this.payments.hasValue() ? this.payments.value() : [],
  );
  protected readonly recent = computed(() => this.paymentList().slice(0, 6));
  protected readonly overdue = computed(() =>
    (this.dues.hasValue() ? this.dues.value() : [])
      .filter((d) => d.status === 'Overdue')
      .slice(0, 6),
  );
  protected readonly todayCount = computed(() => {
    const today = todayIso();
    return this.paymentList().filter((p) => p.date === today).length;
  });
  protected readonly monthCount = computed(
    () => this.paymentList().filter((p) => p.date.startsWith(currentMonthKey())).length,
  );

  protected readonly trendChart = computed(() => {
    const t = this.trend.hasValue() ? this.trend.value() : [];
    return {
      labels: t.map((x) => x.label),
      datasets: [
        barDataset(
          'Collected',
          t.map((x) => x.value),
          t.map((_, i) => (i === t.length - 1 ? COLORS.indigo : COLORS.indigoSoft)),
        ),
      ],
    };
  });
  protected readonly modeChart = computed(() => {
    const month = this.paymentList().filter((p) => p.date.startsWith(currentMonthKey()));
    return {
      labels: [...PAYMENT_MODES],
      datasets: [
        {
          data: PAYMENT_MODES.map((m) =>
            month.filter((p) => p.mode === m).reduce((s, p) => s + p.amount, 0),
          ),
          backgroundColor: SERIES.slice(0, 4),
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };
  });
}
