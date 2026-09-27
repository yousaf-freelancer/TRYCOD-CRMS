import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { dayLabel, formatTime, lastWorkingDay } from '../../../shared/utils/date.util';
import { PageHeader } from '../../../shared/ui/page-header';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { AttendanceService } from '../../attendance/data-access/attendance.service';
import { EmployeeAttendancePanel } from '../ui/employee-attendance-panel';

@Component({
  selector: 'app-my-attendance-page',
  imports: [LucideDynamicIcon, PageHeader, StatusBadge, EmployeeAttendancePanel],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header
      title="My attendance"
      subtitle="Your check-ins, working hours and monthly summary."
    />
    @if (todayRecord(); as t) {
      <div class="card card-pad mb-4 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div class="flex items-center gap-3">
          <span class="grid size-10 place-items-center rounded-xl bg-neutral-950 text-white"
            ><svg lucideIcon="clock" size="18"
          /></span>
          <div>
            <p class="text-xs text-muted">{{ refLabel }}</p>
            <app-status-badge [status]="t.status" />
          </div>
        </div>
        <div>
          <p class="text-xs text-muted">Check-in</p>
          <p class="font-semibold tabular-nums">{{ time(t.checkIn) }}</p>
        </div>
        <div>
          <p class="text-xs text-muted">Check-out</p>
          <p class="font-semibold tabular-nums">
            {{ t.checkOut ? time(t.checkOut) : t.checkIn ? 'Working' : '—' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-muted">Source</p>
          <p class="font-semibold">{{ t.source }}</p>
        </div>
        <p class="ml-auto max-w-xs text-xs text-muted">
          Punches come from the front-desk device once biometric sync is enabled. Contact HR for
          corrections.
        </p>
      </div>
    }
    @if (employeeId(); as id) {
      <app-employee-attendance-panel [employeeId]="id" />
    }
  `,
})
export class MyAttendancePage {
  private readonly auth = inject(AuthService);
  private readonly attendance = inject(AttendanceService);
  protected readonly employeeId = computed(() => this.auth.user()?.employeeId ?? null);
  protected readonly time = formatTime;
  protected readonly refLabel = dayLabel(lastWorkingDay());
  private readonly today = rxResource({
    stream: () => this.attendance.getStaffDaily(lastWorkingDay()),
    defaultValue: [],
  });
  protected readonly todayRecord = computed(
    () =>
      (this.today.hasValue() ? this.today.value() : []).find(
        (r) => r.employeeId === this.employeeId(),
      ) ?? null,
  );
}
