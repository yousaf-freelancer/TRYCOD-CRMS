import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../core/auth/auth.service';
import { AttendanceMarkRow, AttendanceStatus } from '../../../models';
import {
  isSunday,
  lastWorkingDay,
  parseIsoDate,
  toIsoDate,
  todayIso,
} from '../../../shared/utils/date.util';
import { Avatar } from '../../../shared/ui/avatar';
import { EmptyState } from '../../../shared/ui/empty-state';
import { Meter } from '../../../shared/ui/meter';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { TableSkeleton } from '../../../shared/ui/table-skeleton';
import { ToastService } from '../../../shared/ui/toast.service';
import { AttendanceService } from '../data-access/attendance.service';
import { ongoingBatchOptions } from '../ui/batch-options';

const OPTIONS: { value: AttendanceStatus; short: string; active: string }[] = [
  {
    value: 'Present',
    short: 'P',
    active: 'bg-[var(--tc-success-fg)] text-white border-[var(--tc-success-fg)]',
  },
  {
    value: 'Late',
    short: 'L',
    active: 'bg-[var(--tc-warn-fg)] text-white border-[var(--tc-warn-fg)]',
  },
  {
    value: 'Absent',
    short: 'A',
    active: 'bg-[var(--tc-danger-fg)] text-white border-[var(--tc-danger-fg)]',
  },
];

@Component({
  selector: 'app-mark-attendance',
  imports: [
    FormsModule,
    LucideDynamicIcon,
    SelectModule,
    DatePickerModule,
    Avatar,
    Meter,
    StatusBadge,
    EmptyState,
    TableSkeleton,
  ],
  template: `
    <div class="card card-pad mb-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
      <div class="field">
        <label class="field-label" for="att-batch">Batch</label>
        <p-select
          inputId="att-batch"
          [options]="batchOptions.options()"
          optionLabel="label"
          optionValue="value"
          [(ngModel)]="batchId"
          placeholder="Select batch"
          [loading]="batchOptions.batches.isLoading()"
        >
          <ng-template #item let-o>
            <div>
              <p>{{ o.label }}</p>
              <p class="text-xs text-muted">{{ o.timing }} · {{ o.mentor }}</p>
            </div>
          </ng-template>
        </p-select>
      </div>
      <div class="field">
        <label class="field-label" for="att-date">Date</label>
        <p-datepicker
          inputId="att-date"
          [(ngModel)]="date"
          dateFormat="dd M yy"
          [maxDate]="today"
          [disabledDays]="[0]"
          [showIcon]="true"
          iconDisplay="input"
          appendTo="body"
        />
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-secondary"
          (click)="markAll('Present')"
          [disabled]="!rows().length"
        >
          <svg lucideIcon="check-check" size="15" /> All present
        </button>
        <button
          type="button"
          class="btn btn-ghost"
          (click)="clearAll()"
          [disabled]="!rows().length"
        >
          Clear
        </button>
      </div>
    </div>

    @if (!batchId()) {
      <div class="card">
        <app-empty-state
          icon="calendar-check"
          title="Choose a batch"
          message="Pick a batch and date to start marking attendance."
        />
      </div>
    } @else if (sunday()) {
      <div class="card">
        <app-empty-state
          icon="calendar-off"
          title="Sunday is a holiday"
          message="Pick a working day to mark attendance."
        />
      </div>
    } @else if (sheet.error()) {
      <div class="card">
        <app-empty-state
          variant="error"
          title="Couldn't load students"
          actionLabel="Retry"
          (action)="sheet.reload()"
        />
      </div>
    } @else if (sheet.isLoading()) {
      <div class="table-card"><app-table-skeleton [rows]="8" [cols]="4" /></div>
    } @else {
      <div class="table-card">
        <div
          class="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line px-4 py-3 text-[13px]"
        >
          <span class="font-medium">{{ rows().length }} students</span>
          <span class="text-[var(--tc-success-fg)]">Present {{ count('Present') }}</span>
          <span class="text-[var(--tc-warn-fg)]">Late {{ count('Late') }}</span>
          <span class="text-[var(--tc-danger-fg)]">Absent {{ count('Absent') }}</span>
          <span class="text-muted">Unmarked {{ unmarked() }}</span>
          @if (alreadySaved()) {
            <span class="ml-auto"
              ><app-status-badge status="Completed" label="Already marked — editing"
            /></span>
          }
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[720px] text-[13.5px]">
            <thead class="bg-neutral-50 text-left text-xs text-muted">
              <tr>
                <th class="px-4 py-2.5 font-medium">Student</th>
                <th class="px-3 py-2.5 font-medium">Overall</th>
                <th class="px-3 py-2.5 font-medium">Source</th>
                <th class="px-4 py-2.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
              @for (row of rows(); track row.studentId) {
                <tr class="transition-colors hover:bg-neutral-50">
                  <td class="px-4 py-2.5">
                    <div class="flex items-center gap-3">
                      <app-avatar [name]="row.studentName" size="sm" />
                      <div>
                        <p class="font-medium">{{ row.studentName }}</p>
                        <p class="text-xs text-muted">{{ row.studentId }} · {{ row.phone }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="w-40 px-3 py-2.5">
                    <app-meter [value]="row.attendancePct" ariaLabel="Overall attendance" />
                  </td>
                  <td class="px-3 py-2.5 text-xs text-muted">
                    @if (row.source === 'Device') {
                      <span class="inline-flex items-center gap-1"
                        ><svg lucideIcon="fingerprint-pattern" size="13" /> Device</span
                      >
                    } @else {
                      {{ row.source ?? 'Manual' }}
                    }
                  </td>
                  <td class="px-4 py-2.5">
                    <div
                      class="ml-auto flex w-fit gap-1"
                      role="radiogroup"
                      [attr.aria-label]="'Attendance for ' + row.studentName"
                    >
                      @for (o of options; track o.value) {
                        <button
                          type="button"
                          role="radio"
                          [attr.aria-checked]="row.status === o.value"
                          [attr.aria-label]="o.value"
                          [title]="o.value"
                          class="grid size-8 place-items-center rounded-md border text-xs font-semibold transition-colors"
                          [class]="
                            row.status === o.value
                              ? o.active
                              : 'border-line bg-white text-muted hover:border-neutral-400 hover:text-ink'
                          "
                          (click)="set(row, o.value)"
                        >
                          {{ o.short }}
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4">
                    <app-empty-state icon="users" title="No active students in this batch" />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div
          class="sticky bottom-0 flex flex-col gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-xs text-muted">
            Unmarked students are saved as absent. Device punches will sync automatically once the
            biometric integration is live.
          </p>
          <button
            type="button"
            class="btn btn-primary"
            (click)="save()"
            [disabled]="saving() || !rows().length"
          >
            <svg lucideIcon="save" size="15" />
            {{ saving() ? 'Saving…' : alreadySaved() ? 'Update attendance' : 'Save attendance' }}
          </button>
        </div>
      </div>
    }
  `,
})
export class MarkAttendance {
  private readonly service = inject(AttendanceService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  /** `?batch=` query param. */
  readonly batch = input<string>();

  protected readonly options = OPTIONS;
  protected readonly today = parseIsoDate(todayIso());
  protected readonly batchOptions = ongoingBatchOptions();
  protected readonly batchId = signal<string | null>(null);
  protected readonly date = signal<Date>(parseIsoDate(lastWorkingDay()));
  protected readonly saving = signal(false);
  protected readonly rows = signal<AttendanceMarkRow[]>([]);

  private readonly iso = computed(() => toIsoDate(this.date()));
  protected readonly sunday = computed(() => isSunday(this.iso()));

  protected readonly sheet = rxResource({
    params: () =>
      this.batchId() && !this.sunday() ? { batchId: this.batchId()!, date: this.iso() } : undefined,
    stream: ({ params }) => this.service.getMarkSheet(params.batchId, params.date),
  });
  protected readonly alreadySaved = computed(() =>
    this.sheet.hasValue() ? (this.sheet.value()?.some((r) => r.status !== null) ?? false) : false,
  );
  protected readonly unmarked = computed(() => this.rows().filter((r) => !r.status).length);

  constructor() {
    effect(() => {
      const fromQuery = this.batch();
      if (fromQuery) this.batchId.set(fromQuery);
    });
    // Auto-select the first batch for mentors with a single obvious choice.
    effect(() => {
      const opts = this.batchOptions.options();
      if (!this.batchId() && !this.batch() && opts.length) this.batchId.set(opts[0].value);
    });
    effect(() => {
      const value = this.sheet.hasValue() ? this.sheet.value() : undefined;
      this.rows.set(value ? value.map((r) => ({ ...r })) : []);
    });
  }

  protected count(status: AttendanceStatus): number {
    return this.rows().filter((r) => r.status === status).length;
  }

  protected set(row: AttendanceMarkRow, status: AttendanceStatus): void {
    this.rows.update((rows) =>
      rows.map((r) => (r.studentId === row.studentId ? { ...r, status } : r)),
    );
  }

  protected markAll(status: AttendanceStatus): void {
    this.rows.update((rows) => rows.map((r) => ({ ...r, status })));
  }

  protected clearAll(): void {
    this.rows.update((rows) => rows.map((r) => ({ ...r, status: null })));
  }

  protected save(): void {
    const batchId = this.batchId();
    if (!batchId) return;
    this.saving.set(true);
    this.service
      .saveAttendance({
        batchId,
        date: this.iso(),
        markedBy: this.auth.user()?.employeeId ?? '',
        entries: this.rows().map((r) => ({ studentId: r.studentId, status: r.status ?? 'Absent' })),
      })
      .subscribe((n) => {
        this.saving.set(false);
        this.toast.success(
          'Attendance saved',
          `${n} students · ${this.count('Absent') + this.unmarked()} absent`,
        );
        this.sheet.reload();
      });
  }
}
