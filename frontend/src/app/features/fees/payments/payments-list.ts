import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { map } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { PAYMENT_MODES, PaymentMode, PaymentView } from '../../../models';
import { AppDatePipe, InrPipe } from '../../../shared/pipes/format.pipes';
import { downloadCsv } from '../../../shared/utils/csv.util';
import { addDays, dateToIso, parseIsoDate, todayIso } from '../../../shared/utils/date.util';
import { EmptyState } from '../../../shared/ui/empty-state';
import { SearchInput } from '../../../shared/ui/search-input';
import { TableSkeleton } from '../../../shared/ui/table-skeleton';
import { CoursesService } from '../../courses/data-access/courses.service';
import { EmployeesService } from '../../hr/data-access/employees.service';
import { FeesService } from '../data-access/fees.service';

@Component({
  selector: 'app-payments-list',
  imports: [
    FormsModule,
    LucideDynamicIcon,
    TableModule,
    SelectModule,
    DatePickerModule,
    SearchInput,
    EmptyState,
    TableSkeleton,
    InrPipe,
    AppDatePipe,
  ],
  template: `
    <div class="table-card">
      <div class="table-toolbar !items-start lg:!items-center">
        <app-search-input
          class="w-full lg:w-64"
          [(value)]="search"
          placeholder="Search student, receipt…"
        />
        <div class="flex flex-wrap items-center gap-2">
          <p-datepicker
            [(ngModel)]="range"
            selectionMode="range"
            [readonlyInput]="true"
            dateFormat="dd M yy"
            placeholder="Date range"
            [showIcon]="true"
            iconDisplay="input"
            [showButtonBar]="true"
            class="!w-60"
            inputId="pay-range"
            ariaLabel="Date range"
            appendTo="body"
          />
          <p-select
            [options]="modes"
            [(ngModel)]="mode"
            placeholder="All modes"
            [showClear]="true"
            class="!w-36"
            ariaLabel="Filter by mode"
          />
          <p-select
            [options]="courses.value()"
            optionLabel="name"
            optionValue="id"
            [(ngModel)]="courseId"
            placeholder="All courses"
            [showClear]="true"
            class="!w-44"
            ariaLabel="Filter by course"
          />
          <p-select
            [options]="collectors.value()"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="collectedBy"
            placeholder="Collected by"
            [showClear]="true"
            class="!w-44"
            ariaLabel="Filter by collector"
          />
          <button type="button" class="btn btn-secondary" (click)="exportCsv()">
            <svg lucideIcon="download" size="15" /> Export CSV
          </button>
        </div>
      </div>
      <div
        class="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-line bg-surface-muted px-4 py-2.5 text-[13px]"
      >
        <span
          ><span class="text-muted">Payments</span>
          <span class="font-semibold tabular-nums">{{ filtered().length }}</span></span
        >
        <span
          ><span class="text-muted">Total</span>
          <span class="font-semibold tabular-nums">{{ total() | inr }}</span></span
        >
      </div>

      @if (payments.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load payments"
          actionLabel="Retry"
          (action)="payments.reload()"
        />
      } @else if (payments.isLoading()) {
        <app-table-skeleton [rows]="8" [cols]="6" />
      } @else {
        <p-table
          [value]="filtered()"
          dataKey="id"
          [rowHover]="true"
          [paginator]="true"
          [rows]="15"
          [rowsPerPageOptions]="[15, 30, 60]"
          [scrollable]="true"
          scrollHeight="60vh"
          [tableStyle]="{ 'min-width': '1040px' }"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="{first}–{last} of {totalRecords}"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="receiptNo">Receipt <p-sorticon field="receiptNo" /></th>
              <th pSortableColumn="date">Date <p-sorticon field="date" /></th>
              <th pSortableColumn="studentName">Student <p-sorticon field="studentName" /></th>
              <th pSortableColumn="courseName">Course <p-sorticon field="courseName" /></th>
              <th pSortableColumn="mode">Mode <p-sorticon field="mode" /></th>
              <th>Reference</th>
              <th pSortableColumn="collectedByName">
                Collected by <p-sorticon field="collectedByName" />
              </th>
              <th pSortableColumn="amount" class="text-right">
                Amount <p-sorticon field="amount" />
              </th>
              <th class="w-14"><span class="sr-only">Receipt</span></th>
            </tr>
          </ng-template>
          <ng-template #body let-p>
            <tr>
              <td class="mono">{{ p.receiptNo }}</td>
              <td class="whitespace-nowrap">{{ p.date | appDate }}</td>
              <td>
                <p class="cell-primary">{{ p.studentName }}</p>
                <p class="cell-meta">{{ p.studentId }} · {{ p.batchCode }}</p>
              </td>
              <td>{{ p.courseName }}</td>
              <td>{{ p.mode }}</td>
              <td class="mono text-muted">{{ p.reference || '—' }}</td>
              <td>{{ p.collectedByName }}</td>
              <td class="text-right font-semibold tabular-nums">{{ p.amount | inr }}</td>
              <td>
                <button
                  type="button"
                  class="btn btn-ghost btn-icon btn-sm"
                  [attr.aria-label]="'Open receipt ' + p.receiptNo"
                  (click)="openReceipt(p)"
                >
                  <svg lucideIcon="receipt" size="15" />
                </button>
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="9">
                <app-empty-state
                  icon="receipt"
                  title="No payments in this range"
                  message="Widen the date range or clear filters."
                  actionLabel="Clear filters"
                  (action)="clear()"
                />
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>
  `,
})
export class PaymentsList {
  private readonly service = inject(FeesService);
  private readonly coursesService = inject(CoursesService);
  private readonly employees = inject(EmployeesService);
  private readonly router = inject(Router);

  protected readonly modes = [...PAYMENT_MODES];
  protected readonly search = signal('');
  protected readonly range = signal<Date[] | null>([
    parseIsoDate(addDays(todayIso(), -30)),
    parseIsoDate(todayIso()),
  ]);
  protected readonly mode = signal<PaymentMode | null>(null);
  protected readonly courseId = signal<string | null>(null);
  protected readonly collectedBy = signal<string | null>(null);

  protected readonly courses = rxResource({
    stream: () => this.coursesService.getCourses(),
    defaultValue: [],
  });
  protected readonly collectors = rxResource({
    stream: () =>
      this.employees
        .getEmployees({ roles: ['Admin', 'Advisor'] })
        .pipe(map((l) => l.map((e) => ({ label: e.name, value: e.id })))),
    defaultValue: [],
  });

  protected readonly payments = rxResource({
    params: () => {
      const [from, to] = this.range() ?? [];
      return {
        from: dateToIso(from),
        to: dateToIso(to ?? from),
        mode: this.mode(),
        courseId: this.courseId(),
        collectedBy: this.collectedBy(),
      };
    },
    stream: ({ params }) => this.service.getPayments(params),
    defaultValue: [],
  });

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.payments.hasValue() ? this.payments.value() : [];
    return q
      ? list.filter((p) =>
          [p.studentName, p.receiptNo, p.studentId, p.reference].some((v) =>
            v.toLowerCase().includes(q),
          ),
        )
      : list;
  });
  protected readonly total = computed(() => this.filtered().reduce((s, p) => s + p.amount, 0));

  protected clear(): void {
    this.range.set(null);
    this.mode.set(null);
    this.courseId.set(null);
    this.collectedBy.set(null);
    this.search.set('');
  }

  protected openReceipt(p: PaymentView): void {
    void this.router.navigate(['/fees/receipt', p.id]);
  }

  protected exportCsv(): void {
    downloadCsv(
      'payments',
      [
        { header: 'Receipt', value: (p: PaymentView) => p.receiptNo },
        { header: 'Date', value: (p) => p.date },
        { header: 'Student', value: (p) => p.studentName },
        { header: 'Student ID', value: (p) => p.studentId },
        { header: 'Course', value: (p) => p.courseName },
        { header: 'Batch', value: (p) => p.batchCode },
        { header: 'Mode', value: (p) => p.mode },
        { header: 'Reference', value: (p) => p.reference },
        { header: 'Collected by', value: (p) => p.collectedByName },
        { header: 'Amount', value: (p) => p.amount },
      ],
      this.filtered(),
    );
  }
}
