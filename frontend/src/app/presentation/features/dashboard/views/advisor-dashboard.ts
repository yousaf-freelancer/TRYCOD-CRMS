import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { AuthService } from '../../../../core/auth/auth.service';
import { AppDatePipe, InrPipe } from '../../../../shared/pipes/format.pipes';
import { formatTime, greeting, longToday } from '../../../../shared/utils/date.util';
import { formatInrCompact } from '../../../../shared/utils/format.util';
import { Avatar } from '../../../../shared/ui/avatar';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { Meter } from '../../../../shared/ui/meter';
import { PageHeader } from '../../../../shared/ui/page-header';
import { Panel } from '../../../../shared/ui/panel';
import { StatCard } from '../../../../shared/ui/stat-card';
import { StatusBadge } from '../../../../shared/ui/status-badge';
import { DashboardService } from '../../../../data/services/dashboard.service';
import { DashboardSkeleton } from '../ui/dashboard-skeleton';

@Component({
  selector: 'app-advisor-dashboard',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    PageHeader,
    StatCard,
    Panel,
    StatusBadge,
    Avatar,
    EmptyState,
    Meter,
    DashboardSkeleton,
    InrPipe,
    AppDatePipe,
  ],
  template: `
    <app-page-header
      [title]="greeting + ', ' + firstName()"
      [subtitle]="today + ' · Your counselling desk for today.'"
    >
      <a routerLink="/admissions/enquiries" class="btn btn-secondary"
        ><svg lucideIcon="messages-square" size="16" /> Enquiries</a
      >
      <a routerLink="/fees/collect" class="btn btn-primary"
        ><svg lucideIcon="indian-rupee" size="16" /> Collect fee</a
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
          label="Follow-ups today"
          [value]="d.followUpsToday.length"
          icon="phone-forwarded"
          [change]="d.overdueFollowUps + ' overdue'"
          [trend]="d.overdueFollowUps ? 'down' : 'flat'"
        />
        <app-stat-card
          label="New enquiries"
          [value]="d.newEnquiriesCount"
          icon="messages-square"
          hint="awaiting counselling"
        />
        <app-stat-card
          label="My admissions"
          [value]="d.admissionsMonth + ' / ' + d.admissionsTarget"
          icon="user-check"
          hint="this month vs target"
        />
        <app-stat-card
          label="Fees collected by me"
          [value]="compact(d.collectedByMe)"
          icon="wallet"
          [hint]="d.collectedByMeCount + ' receipts this month'"
        />
      </section>

      <section class="mt-4 grid gap-4 lg:grid-cols-5">
        <app-panel
          class="lg:col-span-3"
          title="Today's follow-ups"
          [subtitle]="d.followUpsToday.length + ' scheduled'"
          [padded]="false"
        >
          <a panel-actions routerLink="/admissions/follow-ups" class="btn btn-ghost btn-sm"
            >Open follow-ups</a
          >
          @if (d.followUpsToday.length) {
            <ul class="divide-y divide-neutral-100">
              @for (f of d.followUpsToday; track f.id) {
                <li class="flex items-center gap-3 px-5 py-3">
                  <span class="w-16 shrink-0 text-xs font-medium text-muted tabular-nums">{{
                    time(f.dueTime)
                  }}</span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-[13px] font-medium">{{ f.name }}</p>
                    <p class="truncate text-xs text-muted">{{ f.purpose }} · {{ f.courseName }}</p>
                  </div>
                  <span class="hidden text-xs text-muted sm:inline">{{ f.phone }}</span>
                  <app-status-badge [status]="f.channel" tone="neutral" [dot]="false" />
                </li>
              }
            </ul>
          } @else {
            <app-empty-state
              icon="circle-check"
              title="No follow-ups today"
              message="You're clear for the day. Check upcoming follow-ups to plan ahead."
            />
          }
        </app-panel>

        <app-panel class="lg:col-span-2" title="Admissions target" subtitle="This month">
          <div class="flex items-end justify-between">
            <p class="text-4xl font-semibold tracking-tight tabular-nums">
              {{ d.admissionsMonth }}
            </p>
            <p class="pb-1 text-sm text-muted">of {{ d.admissionsTarget }} admissions</p>
          </div>
          <app-meter
            class="mt-4"
            [value]="targetPct()"
            [thresholds]="false"
            ariaLabel="Admissions target progress"
          />
          <p class="mt-6 text-xs font-medium tracking-wider text-muted uppercase">New enquiries</p>
          <ul class="mt-2 space-y-2.5">
            @for (e of d.newEnquiries; track e.id) {
              <li class="flex items-center gap-3">
                <app-avatar [name]="e.name" size="xs" />
                <span class="min-w-0 flex-1 truncate text-[13px]">{{ e.name }}</span>
                <span class="truncate text-xs text-muted">{{ e.courseName }}</span>
              </li>
            } @empty {
              <li class="text-[13px] text-muted">No new enquiries.</li>
            }
          </ul>
        </app-panel>
      </section>

      <app-panel
        class="mt-4"
        title="Installments due this week"
        subtitle="Remind students before the due date"
        [padded]="false"
      >
        <a panel-actions routerLink="/fees/dues" class="btn btn-ghost btn-sm">All dues</a>
        @if (d.dues.length) {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[560px] text-[13px]">
              <thead class="bg-neutral-50 text-left text-xs text-muted">
                <tr>
                  <th class="px-5 py-2 font-medium">Student</th>
                  <th class="px-3 py-2 font-medium">Batch</th>
                  <th class="px-3 py-2 font-medium">Due date</th>
                  <th class="px-3 py-2 text-right font-medium">Balance</th>
                  <th class="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100">
                @for (due of d.dues; track due.installmentId) {
                  <tr>
                    <td class="px-5 py-2.5 font-medium">{{ due.studentName }}</td>
                    <td class="px-3 py-2.5 text-muted">{{ due.batchCode }}</td>
                    <td class="px-3 py-2.5">{{ due.dueDate | appDate }}</td>
                    <td class="px-3 py-2.5 text-right font-medium tabular-nums">
                      {{ due.balance | inr }}
                    </td>
                    <td class="px-5 py-2.5"><app-status-badge [status]="due.status" /></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-empty-state icon="circle-check" title="Nothing due this week" />
        }
      </app-panel>
    } @else {
      <app-dashboard-skeleton [cards]="4" />
    }
  `,
})
export class AdvisorDashboardView {
  private readonly service = inject(DashboardService);
  private readonly auth = inject(AuthService);

  protected readonly data = rxResource({
    params: () => this.auth.user()?.employeeId ?? '',
    stream: ({ params }) => this.service.getAdvisor(params),
  });
  protected readonly greeting = greeting();
  protected readonly today = longToday();
  protected readonly compact = formatInrCompact;
  protected readonly time = formatTime;
  protected readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');
  protected readonly targetPct = computed(() => {
    const d = this.data.hasValue() ? this.data.value() : undefined;
    return d ? Math.min(Math.round((d.admissionsMonth / d.admissionsTarget) * 100), 100) : 0;
  });
}
