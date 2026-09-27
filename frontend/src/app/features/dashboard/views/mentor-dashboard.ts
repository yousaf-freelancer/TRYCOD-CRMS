import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { AppDatePipe } from '../../../shared/pipes/format.pipes';
import { dayLabel, dayPhrase, greeting, longToday } from '../../../shared/utils/date.util';
import { EmptyState } from '../../../shared/ui/empty-state';
import { Meter } from '../../../shared/ui/meter';
import { PageHeader } from '../../../shared/ui/page-header';
import { Panel } from '../../../shared/ui/panel';
import { StatCard } from '../../../shared/ui/stat-card';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { DashboardService } from '../data-access/dashboard.service';
import { DashboardSkeleton } from '../ui/dashboard-skeleton';

@Component({
  selector: 'app-mentor-dashboard',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    PageHeader,
    StatCard,
    Panel,
    StatusBadge,
    EmptyState,
    Meter,
    DashboardSkeleton,
    AppDatePipe,
  ],
  template: `
    <app-page-header
      [title]="greeting + ', ' + firstName()"
      [subtitle]="today + ' · Your batches at a glance.'"
    >
      <a routerLink="/mentor-reports/write" class="btn btn-secondary"
        ><svg lucideIcon="clipboard-pen" size="16" /> Weekly reports</a
      >
      <a routerLink="/attendance/mark" class="btn btn-primary"
        ><svg lucideIcon="calendar-check" size="16" /> Mark attendance</a
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
          label="My batches"
          [value]="d.batches.length"
          icon="layers"
          [hint]="d.studentsCount + ' active students'"
        />
        <app-stat-card
          label="Attendance to mark"
          [value]="d.toMarkToday"
          icon="calendar-clock"
          [hint]="(d.toMarkToday ? 'batches pending · ' : 'all marked · ') + dayPhrase(d.asOf)"
        />
        <app-stat-card
          label="Avg. attendance"
          [value]="d.avgAttendancePct + '%'"
          icon="chart-line"
          hint="last 30 days"
        />
        <app-stat-card
          label="Pending reports"
          [value]="pendingTotal()"
          icon="clipboard-list"
          [hint]="pendingTotal() ? 'students for last week' : 'all submitted'"
        />
      </section>

      <h2 class="mt-8 mb-3 text-sm font-semibold">My batches</h2>
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        @for (b of d.batches; track b.id) {
          <article class="card card-pad flex flex-col">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="mono text-muted">{{ b.code }}</p>
                <h3 class="mt-0.5 text-[15px] font-semibold">{{ b.courseName }}</h3>
              </div>
              <app-status-badge [status]="b.status" />
            </div>
            <dl class="mt-4 grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <dt class="text-xs text-muted">Timing</dt>
                <dd class="font-medium">{{ b.timing }}</dd>
              </div>
              <div>
                <dt class="text-xs text-muted">Students</dt>
                <dd class="font-medium">{{ b.enrolled }} / {{ b.capacity }}</dd>
              </div>
            </dl>
            @if (b.status === 'Ongoing') {
              <div class="mt-4">
                <p class="mb-1.5 text-xs text-muted">Attendance (30 days)</p>
                <app-meter [value]="b.avgAttendancePct" ariaLabel="Batch attendance" />
              </div>
              <div class="mt-4 flex items-center justify-between border-t border-line pt-4">
                @if (b.todayMarked) {
                  <span
                    class="inline-flex items-center gap-1.5 text-[13px] text-[var(--tc-success-fg)]"
                  >
                    <svg lucideIcon="circle-check" size="15" /> Marked {{ dayPhrase(d.asOf) }} ·
                    {{ b.todayPresentPct }}%
                  </span>
                  <a
                    [routerLink]="['/attendance/mark']"
                    [queryParams]="{ batch: b.id }"
                    class="btn btn-ghost btn-sm"
                    >Edit</a
                  >
                } @else {
                  <span
                    class="inline-flex items-center gap-1.5 text-[13px] text-[var(--tc-warn-fg)]"
                  >
                    <svg lucideIcon="clock" size="15" /> Not marked {{ dayPhrase(d.asOf) }}
                  </span>
                  <a
                    [routerLink]="['/attendance/mark']"
                    [queryParams]="{ batch: b.id }"
                    class="btn btn-primary btn-sm"
                    >Mark now</a
                  >
                }
              </div>
            } @else {
              <p class="mt-4 border-t border-line pt-4 text-[13px] text-muted">
                Starts {{ b.startDate | appDate }}
              </p>
            }
          </article>
        } @empty {
          <div class="card md:col-span-2 xl:col-span-3">
            <app-empty-state
              icon="layers"
              title="No batches assigned"
              message="Batches assigned to you will appear here."
            />
          </div>
        }
      </section>

      <section class="mt-4 grid gap-4 lg:grid-cols-2">
        <app-panel
          title="Pending weekly reports"
          [subtitle]="
            d.pendingReports.length
              ? 'Week of ' + (d.pendingReports[0].weekStart | appDate)
              : 'Last week'
          "
          [padded]="false"
        >
          @if (d.pendingReports.length) {
            <ul class="divide-y divide-neutral-100">
              @for (p of d.pendingReports; track p.batchId) {
                <li class="flex items-center gap-3 px-5 py-3">
                  <div class="min-w-0 flex-1">
                    <p class="text-[13px] font-medium">
                      {{ p.batchCode }}
                      <span class="font-normal text-muted">· {{ p.courseName }}</span>
                    </p>
                    <p class="text-xs text-muted">
                      {{ p.pendingCount }} of {{ p.totalStudents }} students pending
                    </p>
                  </div>
                  <a
                    [routerLink]="['/mentor-reports/write']"
                    [queryParams]="{ batch: p.batchId, week: p.weekStart }"
                    class="btn btn-secondary btn-sm"
                    >Write</a
                  >
                </li>
              }
            </ul>
          } @else {
            <app-empty-state
              icon="circle-check"
              title="All reports submitted"
              message="Nice — every student has last week's report."
            />
          }
        </app-panel>

        <app-panel title="Low attendance" subtitle="Below 75% in the last 30 days" [padded]="false">
          @if (d.lowAttendance.length) {
            <ul class="divide-y divide-neutral-100">
              @for (s of d.lowAttendance; track s.studentId) {
                <li class="flex items-center gap-4 px-5 py-3">
                  <div class="min-w-0 flex-1">
                    <a
                      [routerLink]="['/students', s.studentId]"
                      class="block truncate text-[13px] font-medium hover:underline"
                      >{{ s.studentName }}</a
                    >
                    <p class="text-xs text-muted">{{ s.batchCode }}</p>
                  </div>
                  <app-meter class="w-36" [value]="s.pct" ariaLabel="Attendance" />
                </li>
              }
            </ul>
          } @else {
            <app-empty-state
              icon="thumbs-up"
              title="Everyone is on track"
              message="No student is below the attendance threshold."
            />
          }
        </app-panel>
      </section>
    } @else {
      <app-dashboard-skeleton [cards]="4" />
    }
  `,
})
export class MentorDashboardView {
  private readonly service = inject(DashboardService);
  private readonly auth = inject(AuthService);

  protected readonly data = rxResource({
    params: () => this.auth.user()?.employeeId ?? '',
    stream: ({ params }) => this.service.getMentor(params),
  });
  protected readonly greeting = greeting();
  protected readonly today = longToday();
  protected readonly dayLabel = dayLabel;
  protected readonly dayPhrase = dayPhrase;
  protected readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');
  protected readonly pendingTotal = computed(() =>
    this.data.hasValue()
      ? (this.data.value()?.pendingReports.reduce((s, p) => s + p.pendingCount, 0) ?? 0)
      : 0,
  );
}
