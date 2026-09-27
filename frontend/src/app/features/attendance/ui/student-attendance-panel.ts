import { Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AttendanceCalendar } from '../../../shared/ui/attendance-calendar';
import { EmptyState } from '../../../shared/ui/empty-state';
import { addMonthKey, currentMonthKey } from '../../../shared/utils/date.util';
import { AttendanceService } from '../data-access/attendance.service';

/** Month calendar + summary for one student (profile tab and student portal). */
@Component({
  selector: 'app-student-attendance-panel',
  imports: [AttendanceCalendar, EmptyState],
  host: { class: 'grid gap-4 lg:grid-cols-[1fr_300px]' },
  template: `
    <div class="card card-pad">
      @if (calendar.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load attendance"
          actionLabel="Retry"
          (action)="calendar.reload()"
        />
      } @else {
        <app-attendance-calendar
          [month]="month()"
          [days]="calendar.value()"
          (monthChange)="month.set(shift($event))"
        />
      }
    </div>
    <div class="space-y-4">
      @if (monthSummary.value(); as m) {
        <div class="card card-pad">
          <p class="text-xs text-muted">This month</p>
          <p class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{{ m.pct }}%</p>
          <dl class="mt-4 grid grid-cols-3 gap-2 text-center">
            <div class="rounded-lg bg-[var(--tc-success-bg)] py-2">
              <dt class="text-[11px] text-[var(--tc-success-fg)]">Present</dt>
              <dd class="font-semibold tabular-nums">{{ m.present }}</dd>
            </div>
            <div class="rounded-lg bg-[var(--tc-warn-bg)] py-2">
              <dt class="text-[11px] text-[var(--tc-warn-fg)]">Late</dt>
              <dd class="font-semibold tabular-nums">{{ m.late }}</dd>
            </div>
            <div class="rounded-lg bg-[var(--tc-danger-bg)] py-2">
              <dt class="text-[11px] text-[var(--tc-danger-fg)]">Absent</dt>
              <dd class="font-semibold tabular-nums">{{ m.absent }}</dd>
            </div>
          </dl>
        </div>
      }
      @if (overall.value(); as o) {
        <div class="card card-pad">
          <p class="text-xs text-muted">Overall attendance</p>
          <p
            class="mt-1 text-3xl font-semibold tracking-tight tabular-nums"
            [class.text-red-700]="o.pct > 0 && o.pct < 75"
          >
            {{ o.pct }}%
          </p>
          <p class="mt-1 text-xs text-muted">
            {{ o.present + o.late }} of {{ o.total }} classes attended
          </p>
          @if (o.pct > 0 && o.pct < 75) {
            <p
              class="mt-3 rounded-lg bg-[var(--tc-danger-bg)] px-3 py-2 text-xs text-[var(--tc-danger-fg)]"
            >
              Below the 75% minimum required for certification.
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class StudentAttendancePanel {
  private readonly service = inject(AttendanceService);
  readonly studentId = input.required<string>();
  protected readonly month = signal(currentMonthKey());

  protected readonly calendar = rxResource({
    params: () => ({ id: this.studentId(), month: this.month() }),
    stream: ({ params }) => this.service.getStudentCalendar(params.id, params.month),
    defaultValue: [],
  });
  protected readonly monthSummary = rxResource({
    params: () => ({ id: this.studentId(), month: this.month() }),
    stream: ({ params }) => this.service.getStudentSummary(params.id, params.month),
  });
  protected readonly overall = rxResource({
    params: () => this.studentId(),
    stream: ({ params }) => this.service.getStudentSummary(params),
  });

  protected shift(delta: number): string {
    return addMonthKey(this.month(), delta);
  }
}
