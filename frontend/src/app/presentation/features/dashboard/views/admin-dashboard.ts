import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { ChartModule } from 'primeng/chart';
import { AuthService } from '../../../../core/auth/auth.service';
import { ActivityKind } from '../../../../domain/models';
import { COLORS, SERIES, barDataset, cartesianOptions, lineDataset } from '../../../../shared/charts/chart-theme';
import { AppDatePipe, InrPipe } from '../../../../shared/pipes/format.pipes';
import {
  dayLabel,
  dayPhrase,
  greeting,
  longToday,
  todayIso,
} from '../../../../shared/utils/date.util';
import { formatInrCompact } from '../../../../shared/utils/format.util';
import { Avatar } from '../../../../shared/ui/avatar';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header';
import { Panel } from '../../../../shared/ui/panel';
import { StatCard } from '../../../../shared/ui/stat-card';
import { StatusBadge } from '../../../../shared/ui/status-badge';
import { DashboardService } from '../../../../data/services/dashboard.service';
import { DashboardSkeleton } from '../ui/dashboard-skeleton';
import { Funnel } from '../ui/funnel';

const ACTIVITY_ICONS: Record<ActivityKind, string> = {
  payment: 'indian-rupee',
  admission: 'user-check',
  leave: 'plane',
  attendance: 'calendar-check',
  lead: 'user-plus',
  report: 'clipboard-list',
};

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    ChartModule,
    PageHeader,
    StatCard,
    Panel,
    StatusBadge,
    Avatar,
    EmptyState,
    DashboardSkeleton,
    Funnel,
    InrPipe,
    AppDatePipe,
  ],
  template: `
    <app-page-header
      [title]="greeting + ', ' + firstName()"
      [subtitle]="today + ' · Here is how Trycod is doing today.'"
    >
      <a routerLink="/admissions/leads" class="btn btn-secondary"
        ><svg lucideIcon="user-plus" size="16" /> Add lead</a
      >
      <a routerLink="/fees/collect" class="btn btn-primary"
        ><svg lucideIcon="indian-rupee" size="16" /> Collect fee</a
      >
    </app-page-header>

    @if (data.error()) {
      <div class="card">
        <app-empty-state
          variant="error"
          title="Couldn't load the dashboard"
          message="Please check your connection and try again."
          actionLabel="Retry"
          (action)="data.reload()"
        />
      </div>
    } @else if (data.value(); as d) {
      <section
        class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6"
        aria-label="Key metrics"
      >
        <app-stat-card
          label="Active students"
          [value]="d.activeStudents"
          icon="graduation-cap"
          [change]="'+' + d.activeStudentsChange"
          trend="up"
          hint="joined this month"
        />
        <app-stat-card
          [label]="d.asOf === todayIso ? 'Today’s attendance' : 'Attendance · ' + dayLabel(d.asOf)"
          [value]="d.todayAttendancePct + '%'"
          icon="calendar-check"
          [change]="(d.attendanceChange >= 0 ? '+' : '') + d.attendanceChange + ' pts'"
          [trend]="d.attendanceChange > 0 ? 'up' : d.attendanceChange < 0 ? 'down' : 'flat'"
          hint="vs last class day"
        />
        <app-stat-card
          label="Staff present"
          [value]="d.staffPresent + ' / ' + d.staffTotal"
          icon="users"
          [hint]="d.staffOnLeave.length + ' on leave · ' + dayPhrase(d.asOf)"
        />
        <app-stat-card
          label="Fees collected"
          [value]="compact(d.feesCollectedMonth)"
          icon="wallet"
          [change]="(d.feesChangePct >= 0 ? '+' : '') + d.feesChangePct + '%'"
          [trend]="d.feesChangePct >= 0 ? 'up' : 'down'"
          hint="this month vs last"
        />
        <app-stat-card
          label="Pending fees"
          [value]="compact(d.pendingFees)"
          icon="hourglass"
          [change]="d.overdueCount + ' overdue'"
          trend="down"
          [invertTrend]="false"
          hint="installments"
        />
        <app-stat-card
          label="New admissions"
          [value]="d.newAdmissionsMonth"
          icon="user-check"
          [change]="(d.admissionsChange >= 0 ? '+' : '') + d.admissionsChange"
          [trend]="d.admissionsChange >= 0 ? 'up' : 'down'"
          hint="this month vs last"
        />
      </section>

      <section class="mt-4 grid gap-4 lg:grid-cols-3">
        <app-panel
          class="lg:col-span-2"
          title="Fee collection"
          subtitle="Monthly collections, last 7 months"
        >
          <div class="h-64">
            <p-chart
              type="bar"
              [data]="feeChart()"
              [options]="inrOptions"
              height="100%"
              ariaLabel="Monthly fee collection chart"
            />
          </div>
        </app-panel>
        <app-panel title="Admissions funnel" subtitle="Last 30 days">
          <app-funnel [data]="d.funnel" />
        </app-panel>
      </section>

      <section class="mt-4 grid gap-4 lg:grid-cols-3">
        <app-panel
          class="lg:col-span-2"
          title="Student attendance"
          subtitle="Daily attendance %, last 30 days"
        >
          <div class="h-64">
            <p-chart
              type="line"
              [data]="attendanceChart()"
              [options]="percentOptions"
              height="100%"
              ariaLabel="Attendance trend chart"
            />
          </div>
        </app-panel>
        <app-panel title="Batch strength" subtitle="Active students per batch">
          <div class="h-64">
            <p-chart
              type="bar"
              [data]="strengthChart()"
              [options]="strengthOptions"
              height="100%"
              ariaLabel="Students per batch chart"
            />
          </div>
        </app-panel>
      </section>

      <section class="mt-4 grid gap-4 xl:grid-cols-2">
        <app-panel title="Overdue installments" subtitle="Highest overdue first" [padded]="false">
          <a panel-actions routerLink="/fees/dues" class="btn btn-ghost btn-sm">View all</a>
          @if (d.dues.length) {
            <ul class="divide-y divide-neutral-100">
              @for (due of d.dues; track due.installmentId) {
                <li class="flex items-center gap-3 px-5 py-3">
                  <app-avatar [name]="due.studentName" size="sm" />
                  <div class="min-w-0 flex-1">
                    <a
                      [routerLink]="['/students', due.studentId]"
                      class="block truncate text-[13px] font-medium hover:underline"
                      >{{ due.studentName }}</a
                    >
                    <p class="truncate text-xs text-muted">
                      {{ due.batchCode }} · Installment {{ due.installmentNo }} · due
                      {{ due.dueDate | appDate }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-[13px] font-semibold tabular-nums">{{ due.balance | inr }}</p>
                    <p class="text-xs text-red-700">{{ due.daysOverdue }}d overdue</p>
                  </div>
                </li>
              }
            </ul>
          } @else {
            <app-empty-state
              icon="circle-check"
              title="No overdue installments"
              message="All installments are up to date."
            />
          }
        </app-panel>

        <app-panel
          [title]="d.asOf === todayIso ? 'Absent today' : 'Absent · ' + dayLabel(d.asOf)"
          [subtitle]="d.absentToday.length + ' students marked absent'"
          [padded]="false"
        >
          <a panel-actions routerLink="/attendance/mark" class="btn btn-ghost btn-sm">Attendance</a>
          @if (d.absentToday.length) {
            <ul class="max-h-[340px] divide-y divide-neutral-100 overflow-y-auto">
              @for (s of d.absentToday.slice(0, 8); track s.studentId) {
                <li class="flex items-center gap-3 px-5 py-3">
                  <app-avatar [name]="s.studentName" size="sm" />
                  <div class="min-w-0 flex-1">
                    <a
                      [routerLink]="['/students', s.studentId]"
                      class="block truncate text-[13px] font-medium hover:underline"
                      >{{ s.studentName }}</a
                    >
                    <p class="truncate text-xs text-muted">{{ s.batchCode }} · {{ s.phone }}</p>
                  </div>
                  @if (s.consecutive > 1) {
                    <app-status-badge status="Absent" [label]="s.consecutive + ' days in a row'" />
                  } @else {
                    <app-status-badge status="Absent" />
                  }
                </li>
              }
            </ul>
          } @else {
            <app-empty-state
              icon="calendar-check"
              title="No absences yet"
              message="Morning batches are fully present, or attendance isn't marked yet."
            />
          }
        </app-panel>

        <app-panel
          [title]="
            d.asOf === todayIso ? 'Staff on leave today' : 'Staff on leave · ' + dayLabel(d.asOf)
          "
          [padded]="false"
        >
          <a panel-actions routerLink="/hr/leave" class="btn btn-ghost btn-sm">Leave</a>
          @if (d.staffOnLeave.length) {
            <ul class="divide-y divide-neutral-100">
              @for (s of d.staffOnLeave; track s.employeeId) {
                <li class="flex items-center gap-3 px-5 py-3">
                  <app-avatar [name]="s.employeeName" size="sm" />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-[13px] font-medium">{{ s.employeeName }}</p>
                    <p class="truncate text-xs text-muted">{{ s.designation }}</p>
                  </div>
                  <div class="text-right">
                    <app-status-badge status="On Leave" [label]="s.leaveType" />
                    <p class="mt-1 text-xs text-muted">until {{ s.until | appDate: 'dayMonth' }}</p>
                  </div>
                </li>
              }
            </ul>
          } @else {
            <app-empty-state
              icon="users"
              title="Everyone's in"
              message="No approved leave for today."
            />
          }
        </app-panel>

        <app-panel title="Recent activity" [padded]="false">
          <ol class="px-5 py-2">
            @for (a of d.activity; track a.id; let last = $last) {
              <li class="relative flex gap-3 py-2.5">
                @if (!last) {
                  <span
                    class="absolute top-10 bottom-0 left-4 w-px bg-line"
                    aria-hidden="true"
                  ></span>
                }
                <span
                  class="relative grid size-8 shrink-0 place-items-center rounded-full border border-line bg-white"
                >
                  <svg [lucideIcon]="activityIcons[a.kind]" size="14" strokeWidth="1.75" />
                </span>
                <div class="min-w-0 flex-1 pt-0.5">
                  <p class="text-[13px] text-ink">{{ a.text }}</p>
                  <p class="text-xs text-muted">{{ a.meta }} · {{ a.at | appDate: 'ago' }}</p>
                </div>
              </li>
            }
          </ol>
        </app-panel>
      </section>
    } @else {
      <app-dashboard-skeleton />
    }
  `,
})
export class AdminDashboardView {
  private readonly service = inject(DashboardService);
  private readonly auth = inject(AuthService);

  protected readonly data = rxResource({ stream: () => this.service.getAdmin() });
  protected readonly greeting = greeting();
  protected readonly today = longToday();
  protected readonly activityIcons = ACTIVITY_ICONS;
  protected readonly todayIso = todayIso();
  protected readonly dayLabel = dayLabel;
  protected readonly dayPhrase = dayPhrase;
  protected readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');
  protected readonly compact = formatInrCompact;

  protected readonly inrOptions = cartesianOptions('inr');
  protected readonly percentOptions = cartesianOptions('percent', { min: 50, max: 100 });
  protected readonly strengthOptions = cartesianOptions('number', { horizontal: true });

  protected readonly feeChart = computed(() => {
    const d = this.data.hasValue() ? this.data.value() : undefined;
    const trend = d?.feeTrend ?? [];
    return {
      labels: trend.map((t) => t.label),
      datasets: [
        barDataset(
          'Collected',
          trend.map((t) => t.value),
          trend.map((_, i) => (i === trend.length - 1 ? COLORS.indigo : COLORS.indigoSoft)),
        ),
      ],
    };
  });

  protected readonly attendanceChart = computed(() => {
    const trend = (this.data.hasValue() ? this.data.value()?.attendanceTrend : undefined) ?? [];
    return {
      labels: trend.map((t) => t.label),
      datasets: [
        lineDataset(
          'Attendance',
          trend.map((t) => t.value),
          COLORS.emerald,
        ),
      ],
    };
  });

  protected readonly strengthChart = computed(() => {
    const rows = (this.data.hasValue() ? this.data.value()?.batchStrength : undefined) ?? [];
    return {
      labels: rows.map((r) => r.label),
      datasets: [
        barDataset(
          'Students',
          rows.map((r) => r.value),
          rows.map((_, i) => SERIES[i % SERIES.length]),
        ),
      ],
    };
  });
}
