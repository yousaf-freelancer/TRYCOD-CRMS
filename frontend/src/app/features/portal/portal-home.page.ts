import { TONE_TILE } from '../../shared/ui/tones';
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { AuthService } from '../../core/auth/auth.service';
import { AppDatePipe, InrPipe } from '../../shared/pipes/format.pipes';
import { greeting, longToday } from '../../shared/utils/date.util';
import { EmptyState } from '../../shared/ui/empty-state';
import { Meter } from '../../shared/ui/meter';
import { DashboardService } from '../dashboard/data-access/dashboard.service';
import { DashboardSkeleton } from '../dashboard/ui/dashboard-skeleton';
import { RatingDots } from '../mentor-reports/ui/rating-dots';

@Component({
  selector: 'app-portal-home-page',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    EmptyState,
    Meter,
    RatingDots,
    DashboardSkeleton,
    InrPipe,
    AppDatePipe,
  ],
  host: { class: 'block page-enter' },
  template: `
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
      <section
        class="relative overflow-hidden rounded-card bg-neutral-950 px-6 py-7 text-white sm:px-8"
      >
        <div
          class="pointer-events-none absolute inset-0 opacity-20"
          style="background-image: radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px); background-size: 20px 20px; mask-image: linear-gradient(to left, #000, transparent 70%);"
          aria-hidden="true"
        ></div>
        <p class="relative text-[13px] text-white/60">{{ today }}</p>
        <h1 class="relative mt-1 text-2xl font-semibold tracking-tight">
          {{ hello }}, {{ firstName() }}
        </h1>
        <p class="relative mt-2 text-[13.5px] text-white/70">
          {{ d.courseName }} · <span class="font-mono">{{ d.batchCode }}</span> · {{ d.timing }} ·
          Mentor {{ d.mentorName }}
        </p>
      </section>

      <section class="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Summary">
        <a routerLink="attendance" class="card card-pad transition-shadow hover:shadow-pop">
          <p class="text-[13px] font-medium text-ink-secondary">Attendance</p>
          <p
            class="mt-2 text-[26px] leading-none font-semibold tabular-nums"
            [class.text-red-700]="d.attendancePct < 75"
          >
            {{ d.attendancePct }}%
          </p>
          <app-meter
            class="mt-3"
            [value]="d.attendancePct"
            [showValue]="false"
            ariaLabel="Attendance"
          />
          <p class="mt-2 text-xs text-muted">
            {{ d.monthPresent }}/{{ d.monthWorking }} classes this month
          </p>
        </a>
        <a routerLink="fees" class="card card-pad transition-shadow hover:shadow-pop">
          <p class="text-[13px] font-medium text-ink-secondary">Fees paid</p>
          <p class="mt-2 text-[26px] leading-none font-semibold tabular-nums">{{ d.paid | inr }}</p>
          <p class="mt-3 text-xs text-muted">of {{ d.netFee | inr }} total</p>
        </a>
        <a routerLink="fees" class="card card-pad transition-shadow hover:shadow-pop">
          <p class="text-[13px] font-medium text-ink-secondary">Balance</p>
          <p class="mt-2 text-[26px] leading-none font-semibold tabular-nums">
            {{ d.balance | inr }}
          </p>
          <p class="mt-3 text-xs text-muted">{{ d.balance ? 'pending' : 'fully paid' }}</p>
        </a>
        <a
          routerLink="fees"
          class="card card-pad transition-shadow hover:shadow-pop"
          [class.!border-amber-300]="!!d.nextDue"
        >
          <p class="text-[13px] font-medium text-ink-secondary">Next installment</p>
          @if (d.nextDue; as n) {
            <p class="mt-2 text-[26px] leading-none font-semibold tabular-nums">
              {{ n.balance | inr }}
            </p>
            <p
              class="mt-3 text-xs"
              [class.text-red-700]="n.status === 'Overdue'"
              [class.text-muted]="n.status !== 'Overdue'"
            >
              Due {{ n.dueDate | appDate }}
            </p>
          } @else {
            <p class="mt-2 text-[26px] leading-none font-semibold">—</p>
            <p class="mt-3 text-xs text-muted">No dues</p>
          }
        </a>
      </section>

      <section class="mt-4 grid gap-4 lg:grid-cols-3">
        <div class="card card-pad lg:col-span-2">
          <div class="flex items-center justify-between">
            <h2 class="section-title">Latest mentor report</h2>
            <a routerLink="reports" class="btn btn-ghost btn-sm">All reports</a>
          </div>
          @if (d.latestReport; as r) {
            <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p class="text-[13px] text-muted">
                Week of {{ r.weekStart | appDate }} · {{ r.mentorName }}
              </p>
              <app-rating-dots [value]="r.progressRating" />
            </div>
            <dl class="mt-4 grid gap-4 text-[13px] sm:grid-cols-2">
              <div>
                <dt class="text-xs font-medium text-muted">Strengths</dt>
                <dd class="mt-0.5">{{ r.strengths }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium text-muted">Focus for next week</dt>
                <dd class="mt-0.5">{{ r.improvements }}</dd>
              </div>
              @if (r.remarks) {
                <div class="sm:col-span-2">
                  <dt class="text-xs font-medium text-muted">Remarks</dt>
                  <dd class="mt-0.5">{{ r.remarks }}</dd>
                </div>
              }
            </dl>
          } @else {
            <app-empty-state
              icon="clipboard-list"
              title="No reports yet"
              message="Your mentor's weekly report will appear here."
            />
          }
        </div>
        <div class="card card-pad">
          <h2 class="section-title">Quick links</h2>
          <ul class="mt-3 space-y-1">
            @for (l of links; track l.route) {
              <li>
                <a
                  [routerLink]="l.route"
                  class="flex items-center gap-3 rounded-lg px-2 py-2 text-[13.5px] transition-colors hover:bg-neutral-50"
                >
                  <span class="grid size-8 place-items-center rounded-lg" [class]="tiles[l.tone]"
                    ><svg [lucideIcon]="l.icon" size="15"
                  /></span>
                  {{ l.label }}
                  <svg lucideIcon="chevron-right" size="15" class="ml-auto text-neutral-300" />
                </a>
              </li>
            }
          </ul>
        </div>
      </section>
    } @else if (data.isLoading()) {
      <app-dashboard-skeleton [cards]="4" />
    } @else {
      <div class="card"><app-empty-state icon="user-x" title="Student record not found" /></div>
    }
  `,
})
export class PortalHomePage {
  private readonly service = inject(DashboardService);
  private readonly auth = inject(AuthService);

  protected readonly hello = greeting();
  protected readonly today = longToday();
  protected readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');
  protected readonly data = rxResource({
    params: () => this.auth.user()?.studentId ?? '',
    stream: ({ params }) => this.service.getStudent(params),
  });
  protected readonly tiles = TONE_TILE;
  protected readonly links = [
    { label: 'Attendance calendar', route: 'attendance', icon: 'calendar-check', tone: 'teal' as const },
    { label: 'Fee receipts', route: 'fees', icon: 'receipt', tone: 'indigo' as const },
    { label: 'Mentor reports', route: 'reports', icon: 'clipboard-list', tone: 'pink' as const },
    { label: 'My profile', route: 'profile', icon: 'user', tone: 'violet' as const },
  ];
}
