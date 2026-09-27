import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { MonthlyRegisterRow } from '../../../models';
import { downloadCsv } from '../../../shared/utils/csv.util';
import {
  formatMonth,
  monthKeyOf,
  parseIsoDate,
  toIsoDate,
  todayIso,
  weekdayShort,
} from '../../../shared/utils/date.util';
import { EmptyState } from '../../../shared/ui/empty-state';
import { TableSkeleton } from '../../../shared/ui/table-skeleton';
import { AttendanceService } from '../data-access/attendance.service';
import { ongoingBatchOptions } from '../ui/batch-options';

const CELL: Record<string, string> = {
  Present: 'text-[var(--tc-success-fg)]',
  Late: 'bg-[var(--tc-warn-bg)] text-[var(--tc-warn-fg)]',
  Absent: 'bg-[var(--tc-danger-bg)] text-[var(--tc-danger-fg)]',
};

@Component({
  selector: 'app-monthly-register',
  imports: [
    FormsModule,
    LucideDynamicIcon,
    SelectModule,
    DatePickerModule,
    EmptyState,
    TableSkeleton,
  ],
  template: `
    <div class="card card-pad mb-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_200px_auto] md:items-end">
      <div class="field">
        <label class="field-label" for="reg-batch">Batch</label>
        <p-select
          inputId="reg-batch"
          [options]="batchOptions.options()"
          optionLabel="label"
          optionValue="value"
          [(ngModel)]="batchId"
          placeholder="Select batch"
        />
      </div>
      <div class="field">
        <label class="field-label" for="reg-month">Month</label>
        <p-datepicker
          inputId="reg-month"
          [(ngModel)]="month"
          view="month"
          dateFormat="M yy"
          [maxDate]="today"
          [showIcon]="true"
          iconDisplay="input"
          [readonlyInput]="true"
          appendTo="body"
        />
      </div>
      <button
        type="button"
        class="btn btn-secondary"
        (click)="exportCsv()"
        [disabled]="!rows().length"
      >
        <svg lucideIcon="download" size="15" /> Export CSV
      </button>
    </div>

    @if (!batchId()) {
      <div class="card">
        <app-empty-state
          icon="table"
          title="Choose a batch"
          message="Select a batch to see its monthly attendance register."
        />
      </div>
    } @else if (register.error()) {
      <div class="card">
        <app-empty-state
          variant="error"
          title="Couldn't load register"
          actionLabel="Retry"
          (action)="register.reload()"
        />
      </div>
    } @else if (register.isLoading()) {
      <div class="table-card"><app-table-skeleton [rows]="8" [cols]="8" /></div>
    } @else {
      <div class="table-card">
        <div
          class="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3"
        >
          <p class="text-sm font-semibold">{{ title() }}</p>
          <p class="flex gap-3 text-xs text-muted">
            <span><b class="text-[var(--tc-success-fg)]">P</b> Present</span>
            <span><b class="text-[var(--tc-warn-fg)]">L</b> Late</span>
            <span><b class="text-[var(--tc-danger-fg)]">A</b> Absent</span>
            <span>· Not marked</span>
          </p>
        </div>
        @if (rows().length) {
          <div class="max-h-[65vh] overflow-auto">
            <table class="border-separate border-spacing-0 text-[12.5px]">
              <thead class="sticky top-0 z-10">
                <tr class="bg-neutral-50 text-muted">
                  <th
                    class="sticky left-0 z-20 min-w-52 border-r border-b border-line bg-neutral-50 px-4 py-2 text-left font-medium"
                  >
                    Student
                  </th>
                  @for (d of dates(); track d) {
                    <th class="min-w-9 border-b border-line px-1 py-1.5 text-center font-medium">
                      <span class="block text-[10px] text-neutral-400">{{ weekday(d) }}</span
                      >{{ d.slice(8) }}
                    </th>
                  }
                  <th class="border-b border-l border-line px-2 py-2 font-medium">P</th>
                  <th class="border-b border-line px-2 py-2 font-medium">L</th>
                  <th class="border-b border-line px-2 py-2 font-medium">A</th>
                  <th class="border-b border-line px-3 py-2 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                @for (r of rows(); track r.studentId) {
                  <tr class="hover:bg-neutral-50">
                    <th
                      scope="row"
                      class="sticky left-0 z-10 border-r border-b border-neutral-100 bg-white px-4 py-2 text-left font-medium whitespace-nowrap"
                    >
                      {{ r.studentName }}
                    </th>
                    @for (d of dates(); track d) {
                      <td class="border-b border-neutral-100 p-0.5 text-center">
                        <span
                          class="grid h-7 place-items-center rounded font-semibold"
                          [class]="cell(r.days[d])"
                          [title]="d + ': ' + (r.days[d] ?? 'Not marked')"
                        >
                          {{ r.days[d] ? r.days[d]![0] : '·' }}
                        </span>
                      </td>
                    }
                    <td class="border-b border-l border-neutral-100 px-2 text-center tabular-nums">
                      {{ r.present }}
                    </td>
                    <td class="border-b border-neutral-100 px-2 text-center tabular-nums">
                      {{ r.late }}
                    </td>
                    <td class="border-b border-neutral-100 px-2 text-center tabular-nums">
                      {{ r.absent }}
                    </td>
                    <td
                      class="border-b border-neutral-100 px-3 text-center font-semibold tabular-nums"
                      [class.text-red-700]="r.pct < 75"
                    >
                      {{ r.pct }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-empty-state
            icon="calendar-x"
            title="No attendance for this month"
            message="Try another month or batch."
          />
        }
      </div>
    }
  `,
})
export class MonthlyRegisterView {
  private readonly service = inject(AttendanceService);
  readonly batch = input<string>();

  protected readonly today = parseIsoDate(todayIso());
  protected readonly batchOptions = ongoingBatchOptions();
  protected readonly batchId = signal<string | null>(null);
  protected readonly month = signal<Date>(parseIsoDate(todayIso()));
  private readonly monthKey = computed(() => monthKeyOf(toIsoDate(this.month())));

  protected readonly register = rxResource({
    params: () =>
      this.batchId() ? { batchId: this.batchId()!, month: this.monthKey() } : undefined,
    stream: ({ params }) => this.service.getMonthlyRegister(params.batchId, params.month),
  });
  protected readonly dates = computed(() =>
    this.register.hasValue() ? (this.register.value()?.dates ?? []) : [],
  );
  protected readonly rows = computed(() =>
    this.register.hasValue() ? (this.register.value()?.rows ?? []) : [],
  );
  protected readonly title = computed(() => {
    const opt = this.batchOptions.options().find((o) => o.value === this.batchId());
    return `${opt?.label ?? ''} · ${formatMonth(this.monthKey(), true)}`;
  });

  constructor() {
    effect(() => {
      const b = this.batch();
      if (b) this.batchId.set(b);
    });
    effect(() => {
      const opts = this.batchOptions.options();
      if (!this.batchId() && !this.batch() && opts.length) this.batchId.set(opts[0].value);
    });
  }

  protected weekday(d: string): string {
    return weekdayShort(d).slice(0, 2);
  }

  protected cell(status: string | null | undefined): string {
    return status ? CELL[status] : 'text-neutral-300';
  }

  protected exportCsv(): void {
    const dates = this.dates();
    downloadCsv(
      `attendance-register-${this.monthKey()}`,
      [
        { header: 'Student', value: (r: MonthlyRegisterRow) => r.studentName },
        ...dates.map((d) => ({
          header: d,
          value: (r: MonthlyRegisterRow) => r.days[d]?.[0] ?? '',
        })),
        { header: 'Present', value: (r) => r.present },
        { header: 'Late', value: (r) => r.late },
        { header: 'Absent', value: (r) => r.absent },
        { header: '%', value: (r) => r.pct },
      ],
      this.rows(),
    );
  }
}
