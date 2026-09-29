import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { StaffAttendanceView, StaffMonthlySummary } from '../../../../domain/models';
import { DurationPipe } from '../../../../shared/pipes/format.pipes';
import { downloadCsv } from '../../../../shared/utils/csv.util';
import {
  formatTime,
  lastWorkingDay,
  monthKeyOf,
  parseIsoDate,
  toIsoDate,
  todayIso,
} from '../../../../shared/utils/date.util';
import { Avatar } from '../../../../shared/ui/avatar';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { Meter } from '../../../../shared/ui/meter';
import { SearchInput } from '../../../../shared/ui/search-input';
import { StatusBadge } from '../../../../shared/ui/status-badge';
import { TableSkeleton } from '../../../../shared/ui/table-skeleton';
import { AttendanceService } from '../../../../data/services/attendance.service';
import { StaffCorrectionDialog } from './staff-correction-dialog';

@Component({
  selector: 'app-staff-attendance',
  imports: [
    FormsModule,
    LucideDynamicIcon,
    TableModule,
    DatePickerModule,
    SelectButtonModule,
    TooltipModule,
    Avatar,
    Meter,
    StatusBadge,
    SearchInput,
    EmptyState,
    TableSkeleton,
    StaffCorrectionDialog,
    DurationPipe,
  ],
  template: `
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p-selectbutton
        [options]="views"
        optionLabel="label"
        optionValue="value"
        [(ngModel)]="view"
        [allowEmpty]="false"
        ariaLabelledBy="staff-view"
      />
      <span id="staff-view" class="sr-only">View</span>
      <span
        pTooltip="Biometric device integration is planned for a later release"
        tooltipPosition="left"
        class="inline-flex"
      >
        <button type="button" class="btn btn-secondary" disabled>
          <svg lucideIcon="fingerprint-pattern" size="15" /> Sync from biometric device
          <span class="kbd">Coming soon</span>
        </button>
      </span>
    </div>

    @if (view() === 'daily') {
      <div class="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        @for (s of dailyStats(); track s.label) {
          <div class="card px-4 py-3">
            <p class="text-xs text-muted">{{ s.label }}</p>
            <p class="mt-1 text-xl font-semibold tabular-nums">{{ s.value }}</p>
          </div>
        }
      </div>
      <div class="table-card">
        <div class="table-toolbar">
          <app-search-input class="w-full sm:w-64" [(value)]="search" placeholder="Search staff…" />
          <p-datepicker
            [(ngModel)]="date"
            dateFormat="dd M yy"
            [maxDate]="today"
            [showIcon]="true"
            iconDisplay="input"
            class="!w-48"
            inputId="staff-date"
            ariaLabel="Date"
            appendTo="body"
          />
        </div>
        @if (daily.error()) {
          <app-empty-state
            variant="error"
            title="Couldn't load staff attendance"
            actionLabel="Retry"
            (action)="daily.reload()"
          />
        } @else if (daily.isLoading()) {
          <app-table-skeleton [rows]="8" [cols]="6" />
        } @else {
          <p-table
            [value]="dailyFiltered()"
            dataKey="id"
            [rowHover]="true"
            [scrollable]="true"
            scrollHeight="60vh"
            [tableStyle]="{ 'min-width': '900px' }"
          >
            <ng-template #header>
              <tr>
                <th pSortableColumn="employeeName">Staff <p-sorticon field="employeeName" /></th>
                <th pSortableColumn="checkIn">Check-in <p-sorticon field="checkIn" /></th>
                <th pSortableColumn="checkOut">Check-out <p-sorticon field="checkOut" /></th>
                <th pSortableColumn="workingMinutes">
                  Working hours <p-sorticon field="workingMinutes" />
                </th>
                <th pSortableColumn="status">Status <p-sorticon field="status" /></th>
                <th pSortableColumn="source">Source <p-sorticon field="source" /></th>
                <th class="w-20"><span class="sr-only">Actions</span></th>
              </tr>
            </ng-template>
            <ng-template #body let-r>
              <tr>
                <td>
                  <div class="flex items-center gap-3">
                    <app-avatar [name]="r.employeeName" size="sm" />
                    <div>
                      <p class="cell-primary">{{ r.employeeName }}</p>
                      <p class="cell-meta">{{ r.designation }}</p>
                    </div>
                  </div>
                </td>
                <td class="tabular-nums">{{ time(r.checkIn) }}</td>
                <td class="tabular-nums">
                  @if (r.checkIn && !r.checkOut && r.date === todayIso) {
                    <span class="text-xs text-[var(--tc-info-fg)]">Working</span>
                  } @else {
                    {{ time(r.checkOut) }}
                  }
                </td>
                <td class="tabular-nums">{{ r.workingMinutes | duration: 'minutes' }}</td>
                <td><app-status-badge [status]="r.status" /></td>
                <td class="text-xs">
                  <span class="inline-flex items-center gap-1 text-muted"
                    ><svg
                      [lucideIcon]="r.source === 'Device' ? 'fingerprint-pattern' : 'pencil'"
                      size="12"
                    />
                    {{ r.source }}</span
                  >
                </td>
                <td>
                  <button type="button" class="btn btn-ghost btn-sm" (click)="edit(r)">Edit</button>
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="7"><app-empty-state icon="users" title="No staff records" /></td>
              </tr>
            </ng-template>
          </p-table>
        }
      </div>
    } @else {
      <div class="table-card">
        <div class="table-toolbar">
          <p-datepicker
            [(ngModel)]="month"
            view="month"
            dateFormat="MM yy"
            [maxDate]="today"
            [showIcon]="true"
            iconDisplay="input"
            [readonlyInput]="true"
            class="!w-52"
            inputId="staff-month"
            ariaLabel="Month"
            appendTo="body"
          />
          <button type="button" class="btn btn-secondary" (click)="exportMonthly()">
            <svg lucideIcon="download" size="15" /> Export CSV
          </button>
        </div>
        @if (monthly.error()) {
          <app-empty-state
            variant="error"
            title="Couldn't load summary"
            actionLabel="Retry"
            (action)="monthly.reload()"
          />
        } @else if (monthly.isLoading()) {
          <app-table-skeleton [rows]="8" [cols]="7" />
        } @else {
          <p-table
            [value]="monthly.value()"
            dataKey="employeeId"
            [rowHover]="true"
            [scrollable]="true"
            scrollHeight="62vh"
            [tableStyle]="{ 'min-width': '980px' }"
            sortField="employeeName"
            [sortOrder]="1"
          >
            <ng-template #header>
              <tr>
                <th pSortableColumn="employeeName">Staff <p-sorticon field="employeeName" /></th>
                <th pSortableColumn="workingDays">Days <p-sorticon field="workingDays" /></th>
                <th pSortableColumn="present">Present <p-sorticon field="present" /></th>
                <th pSortableColumn="late">Late <p-sorticon field="late" /></th>
                <th pSortableColumn="halfDay">Half day <p-sorticon field="halfDay" /></th>
                <th pSortableColumn="absent">Absent <p-sorticon field="absent" /></th>
                <th pSortableColumn="onLeave">On leave <p-sorticon field="onLeave" /></th>
                <th pSortableColumn="avgMinutes">Avg. hours <p-sorticon field="avgMinutes" /></th>
                <th pSortableColumn="pct" class="w-44">Attendance <p-sorticon field="pct" /></th>
              </tr>
            </ng-template>
            <ng-template #body let-s>
              <tr>
                <td>
                  <p class="cell-primary">{{ s.employeeName }}</p>
                  <p class="cell-meta">{{ s.department }}</p>
                </td>
                <td class="tabular-nums">{{ s.workingDays }}</td>
                <td class="tabular-nums">{{ s.present }}</td>
                <td class="tabular-nums" [class.text-amber-700]="s.late > 2">{{ s.late }}</td>
                <td class="tabular-nums">{{ s.halfDay }}</td>
                <td class="tabular-nums" [class.text-red-700]="s.absent > 0">{{ s.absent }}</td>
                <td class="tabular-nums">{{ s.onLeave }}</td>
                <td class="tabular-nums">{{ s.avgMinutes | duration: 'minutes' }}</td>
                <td><app-meter [value]="s.pct" ariaLabel="Attendance" /></td>
              </tr>
            </ng-template>
          </p-table>
        }
      </div>
    }

    <app-staff-correction-dialog
      [(visible)]="editOpen"
      [record]="editing()"
      (saved)="daily.reload()"
    />
  `,
})
export class StaffAttendancePage {
  private readonly service = inject(AttendanceService);

  protected readonly views = [
    { label: 'Daily', value: 'daily' },
    { label: 'Monthly summary', value: 'monthly' },
  ];
  protected readonly view = signal<'daily' | 'monthly'>('daily');
  protected readonly today = parseIsoDate(todayIso());
  protected readonly todayIso = todayIso();
  protected readonly time = formatTime;
  protected readonly search = signal('');
  protected readonly date = signal<Date>(parseIsoDate(lastWorkingDay()));
  protected readonly month = signal<Date>(parseIsoDate(todayIso()));

  protected readonly daily = rxResource({
    params: () => toIsoDate(this.date()),
    stream: ({ params }) => this.service.getStaffDaily(params),
    defaultValue: [],
  });
  protected readonly monthly = rxResource({
    params: () => (this.view() === 'monthly' ? monthKeyOf(toIsoDate(this.month())) : undefined),
    stream: ({ params }) => this.service.getStaffMonthly(params),
    defaultValue: [],
  });

  private readonly dailyList = computed(() => (this.daily.hasValue() ? this.daily.value() : []));
  protected readonly dailyFiltered = computed(() => {
    const q = this.search().toLowerCase();
    return this.dailyList().filter(
      (r) =>
        !q || r.employeeName.toLowerCase().includes(q) || r.designation.toLowerCase().includes(q),
    );
  });
  protected readonly dailyStats = computed(() => {
    const list = this.dailyList();
    const n = (s: string) => list.filter((r) => r.status === s).length;
    return [
      { label: 'Total staff', value: list.length },
      { label: 'Present', value: n('Present') },
      { label: 'Late', value: n('Late') },
      { label: 'On leave / half day', value: n('On Leave') + n('Half Day') },
      { label: 'Absent', value: n('Absent') },
    ];
  });

  protected readonly editOpen = signal(false);
  protected readonly editing = signal<StaffAttendanceView | null>(null);

  protected edit(r: StaffAttendanceView): void {
    this.editing.set(r);
    this.editOpen.set(true);
  }

  protected exportMonthly(): void {
    downloadCsv(
      `staff-attendance-${monthKeyOf(toIsoDate(this.month()))}`,
      [
        { header: 'Employee', value: (s: StaffMonthlySummary) => s.employeeName },
        { header: 'Department', value: (s) => s.department },
        { header: 'Days', value: (s) => s.workingDays },
        { header: 'Present', value: (s) => s.present },
        { header: 'Late', value: (s) => s.late },
        { header: 'Half day', value: (s) => s.halfDay },
        { header: 'Absent', value: (s) => s.absent },
        { header: 'On leave', value: (s) => s.onLeave },
        { header: 'Avg minutes', value: (s) => s.avgMinutes },
        { header: 'Attendance %', value: (s) => s.pct },
      ],
      this.monthly.hasValue() ? this.monthly.value() : [],
    );
  }
}
