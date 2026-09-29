import { Component, computed, input, output } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { DayAttendance, MonthKey } from '../../domain/models';
import { formatMonth, isSunday, monthDates, parseIsoDate, todayIso } from '../utils/date.util';

interface Cell {
  date: string | null;
  day: number;
  status: DayAttendance['status'] | null;
  sunday: boolean;
  today: boolean;
}

const STATUS_CLASS: Record<string, string> = {
  Present:
    'bg-[var(--tc-success-bg)] text-[var(--tc-success-fg)] border-[var(--tc-success-border)]',
  Late: 'bg-[var(--tc-warn-bg)] text-[var(--tc-warn-fg)] border-[var(--tc-warn-border)]',
  'Half Day': 'bg-[var(--tc-warn-bg)] text-[var(--tc-warn-fg)] border-[var(--tc-warn-border)]',
  Absent: 'bg-[var(--tc-danger-bg)] text-[var(--tc-danger-fg)] border-[var(--tc-danger-border)]',
  'On Leave': 'bg-[var(--tc-info-bg)] text-[var(--tc-info-fg)] border-[var(--tc-info-border)]',
};

/** Month calendar colouring each day by attendance status. */
@Component({
  selector: 'app-attendance-calendar',
  imports: [LucideDynamicIcon],
  host: { class: 'block' },
  template: `
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-sm font-semibold">{{ title() }}</h3>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="btn btn-ghost btn-icon btn-sm"
          aria-label="Previous month"
          (click)="monthChange.emit(-1)"
        >
          <svg lucideIcon="chevron-left" size="16" />
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-icon btn-sm"
          aria-label="Next month"
          [disabled]="!canGoNext()"
          (click)="monthChange.emit(1)"
        >
          <svg lucideIcon="chevron-right" size="16" />
        </button>
      </div>
    </div>
    <div
      class="grid grid-cols-7 gap-1.5 text-center"
      role="grid"
      [attr.aria-label]="'Attendance for ' + title()"
    >
      @for (w of weekdays; track w) {
        <div class="pb-1 text-[11px] font-medium text-muted" role="columnheader">{{ w }}</div>
      }
      @for (cell of cells(); track $index) {
        @if (cell.date) {
          <div
            role="gridcell"
            class="flex aspect-square min-h-9 flex-col items-center justify-center rounded-lg border text-[13px] font-medium tabular-nums"
            [class]="cellClass(cell)"
            [attr.title]="cell.date + (cell.status ? ' · ' + cell.status : '')"
            [attr.aria-label]="
              cell.day + ': ' + (cell.status ?? (cell.sunday ? 'Holiday' : 'No record'))
            "
          >
            {{ cell.day }}
          </div>
        } @else {
          <div aria-hidden="true"></div>
        }
      }
    </div>
    <div class="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
      @for (l of legend(); track l.label) {
        <span class="inline-flex items-center gap-1.5">
          <span class="size-2.5 rounded-sm border" [class]="l.cls"></span>{{ l.label }}
        </span>
      }
    </div>
  `,
})
export class AttendanceCalendar {
  readonly month = input.required<MonthKey>();
  readonly days = input.required<DayAttendance[]>();
  /** Staff calendars also show On Leave / Half Day in the legend. */
  readonly staff = input(false);
  readonly monthChange = output<number>();

  protected readonly weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  protected readonly title = computed(() => formatMonth(this.month(), true));
  protected readonly canGoNext = computed(() => this.month() < todayIso().slice(0, 7));

  protected readonly legend = computed(() => {
    const base = [
      { label: 'Present', cls: STATUS_CLASS['Present'] },
      { label: 'Late', cls: STATUS_CLASS['Late'] },
      { label: 'Absent', cls: STATUS_CLASS['Absent'] },
    ];
    return this.staff()
      ? [
          ...base,
          { label: 'Half day', cls: STATUS_CLASS['Half Day'] },
          { label: 'On leave', cls: STATUS_CLASS['On Leave'] },
        ]
      : [
          ...base,
          { label: 'Sunday / holiday', cls: 'bg-neutral-50 border-dashed border-neutral-200' },
        ];
  });

  protected readonly cells = computed<Cell[]>(() => {
    const dates = monthDates(this.month());
    const map = new Map(this.days().map((d) => [d.date, d.status]));
    const lead = (parseIsoDate(dates[0]).getDay() + 6) % 7;
    const today = todayIso();
    const blanks: Cell[] = Array.from({ length: lead }, () => ({
      date: null,
      day: 0,
      status: null,
      sunday: false,
      today: false,
    }));
    return [
      ...blanks,
      ...dates.map((date, i) => ({
        date,
        day: i + 1,
        status: map.get(date) ?? null,
        sunday: isSunday(date),
        today: date === today,
      })),
    ];
  });

  protected cellClass(cell: Cell): string {
    const ring = cell.today ? ' ring-2 ring-neutral-950 ring-offset-1' : '';
    if (cell.status) return STATUS_CLASS[cell.status] + ring;
    if (cell.sunday)
      return 'bg-neutral-50 border-dashed border-neutral-200 text-neutral-400' + ring;
    return 'border-line text-neutral-400' + ring;
  }
}
