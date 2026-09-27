import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { DayAttendance } from '../../../models';
import { DurationPipe } from '../../../shared/pipes/format.pipes';
import {
  addMonthKey,
  currentMonthKey,
  formatDate,
  formatTime,
  weekdayShort,
} from '../../../shared/utils/date.util';
import { AttendanceCalendar } from '../../../shared/ui/attendance-calendar';
import { EmptyState } from '../../../shared/ui/empty-state';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { AttendanceService } from '../../attendance/data-access/attendance.service';

/** Staff attendance: calendar, monthly summary and daily log. */
@Component({
  selector: 'app-employee-attendance-panel',
  imports: [LucideDynamicIcon, AttendanceCalendar, StatusBadge, EmptyState, DurationPipe],
  host: { class: 'block space-y-4' },
  template: `
    <div class="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div class="card card-pad">
        @if (records.error()) {
          <app-empty-state
            variant="error"
            title="Couldn't load attendance"
            actionLabel="Retry"
            (action)="records.reload()"
          />
        } @else {
          <app-attendance-calendar
            [month]="month()"
            [days]="days()"
            [staff]="true"
            (monthChange)="month.set(shift($event))"
          />
        }
      </div>
      <div class="card card-pad">
        <p class="text-xs text-muted">Summary</p>
        <dl class="mt-3 space-y-2.5 text-[13px]">
          @for (s of summary(); track s.label) {
            <div class="flex items-center justify-between">
              <dt class="text-ink-secondary">{{ s.label }}</dt>
              <dd class="font-semibold tabular-nums">{{ s.value }}</dd>
            </div>
          }
        </dl>
      </div>
    </div>
    <div class="card overflow-hidden">
      <div class="card-header"><h3 class="card-title">Daily log</h3></div>
      <div class="max-h-96 overflow-auto">
        <table class="w-full min-w-[560px] text-[13px]">
          <thead class="sticky top-0 bg-neutral-50 text-left text-xs text-muted">
            <tr>
              <th class="px-5 py-2 font-medium">Date</th>
              <th class="px-3 py-2 font-medium">Check-in</th>
              <th class="px-3 py-2 font-medium">Check-out</th>
              <th class="px-3 py-2 font-medium">Hours</th>
              <th class="px-3 py-2 font-medium">Status</th>
              <th class="px-5 py-2 font-medium">Source</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            @for (r of list(); track r.id) {
              <tr>
                <td class="px-5 py-2">{{ day(r.date) }}</td>
                <td class="px-3 py-2 tabular-nums">{{ time(r.checkIn) }}</td>
                <td class="px-3 py-2 tabular-nums">{{ time(r.checkOut) }}</td>
                <td class="px-3 py-2 tabular-nums">{{ r.workingMinutes | duration: 'minutes' }}</td>
                <td class="px-3 py-2"><app-status-badge [status]="r.status" /></td>
                <td class="px-5 py-2 text-xs text-muted">
                  <span class="inline-flex items-center gap-1"
                    ><svg
                      [lucideIcon]="r.source === 'Device' ? 'fingerprint-pattern' : 'pencil'"
                      size="12"
                    />
                    {{ r.source }}</span
                  >
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-5 py-8 text-center text-muted">
                  No records for this month.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class EmployeeAttendancePanel {
  private readonly service = inject(AttendanceService);
  readonly employeeId = input.required<string>();
  protected readonly month = signal(currentMonthKey());
  protected readonly time = formatTime;

  protected readonly records = rxResource({
    params: () => ({ id: this.employeeId(), month: this.month() }),
    stream: ({ params }) => this.service.getStaffCalendar(params.id, params.month),
    defaultValue: [],
  });
  protected readonly list = computed(() => (this.records.hasValue() ? this.records.value() : []));
  protected readonly days = computed<DayAttendance[]>(() =>
    this.list().map((r) => ({ date: r.date, status: r.status })),
  );
  protected readonly summary = computed(() => {
    const list = this.list();
    const n = (s: string) => list.filter((r) => r.status === s).length;
    const worked = list.filter((r) => r.workingMinutes > 0);
    const avg = worked.length
      ? Math.round(worked.reduce((s, r) => s + r.workingMinutes, 0) / worked.length)
      : 0;
    return [
      { label: 'Working days', value: list.length },
      { label: 'Present', value: n('Present') },
      { label: 'Late', value: n('Late') },
      { label: 'Half day', value: n('Half Day') },
      { label: 'On leave', value: n('On Leave') },
      { label: 'Absent', value: n('Absent') },
      { label: 'Avg. hours / day', value: avg ? `${Math.floor(avg / 60)}h ${avg % 60}m` : '—' },
    ];
  });

  protected shift(delta: number): string {
    return addMonthKey(this.month(), delta);
  }

  protected day(iso: string): string {
    return `${weekdayShort(iso)}, ${formatDate(iso)}`;
  }
}
