import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { DueItem } from '../../../../domain/models';
import { AppDatePipe, InrPipe } from '../../../../shared/pipes/format.pipes';
import { downloadCsv } from '../../../../shared/utils/csv.util';
import { addDays, todayIso } from '../../../../shared/utils/date.util';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { RowAction, RowActions } from '../../../../shared/ui/row-actions';
import { SearchInput } from '../../../../shared/ui/search-input';
import { StatusBadge } from '../../../../shared/ui/status-badge';
import { TableSkeleton } from '../../../../shared/ui/table-skeleton';
import { ToastService } from '../../../../shared/ui/toast.service';
import { FeesService } from '../../../../data/services/fees.service';

type DueView = 'overdue' | 'week' | 'month' | 'all';

@Component({
  selector: 'app-dues-list',
  imports: [
    FormsModule,
    LucideDynamicIcon,
    TableModule,
    SelectButtonModule,
    SearchInput,
    StatusBadge,
    EmptyState,
    TableSkeleton,
    RowActions,
    InrPipe,
    AppDatePipe,
  ],
  template: `
    <div class="table-card">
      <div class="table-toolbar">
        <app-search-input
          class="w-full sm:w-72"
          [(value)]="search"
          placeholder="Search student, batch…"
        />
        <div class="flex flex-wrap items-center gap-2">
          <p-selectbutton
            [options]="views"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="view"
            [allowEmpty]="false"
            size="small"
            ariaLabelledBy="dues-view"
          />
          <span id="dues-view" class="sr-only">Show dues</span>
          <button type="button" class="btn btn-secondary" (click)="exportCsv()">
            <svg lucideIcon="download" size="15" /> Export CSV
          </button>
        </div>
      </div>
      <div
        class="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-line bg-surface-muted px-4 py-2.5 text-[13px]"
      >
        <span
          ><span class="text-muted">Installments</span>
          <span class="font-semibold tabular-nums">{{ filtered().length }}</span></span
        >
        <span
          ><span class="text-muted">Students</span>
          <span class="font-semibold tabular-nums">{{ studentCount() }}</span></span
        >
        <span
          ><span class="text-muted">Outstanding</span>
          <span class="font-semibold tabular-nums">{{ total() | inr }}</span></span
        >
      </div>

      @if (dues.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load dues"
          actionLabel="Retry"
          (action)="dues.reload()"
        />
      } @else if (dues.isLoading() && !dues.value().length) {
        <app-table-skeleton [rows]="8" [cols]="6" />
      } @else {
        <p-table
          [value]="filtered()"
          dataKey="installmentId"
          [rowHover]="true"
          [paginator]="true"
          [rows]="15"
          [scrollable]="true"
          scrollHeight="60vh"
          [tableStyle]="{ 'min-width': '980px' }"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="{first}–{last} of {totalRecords}"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="studentName">Student <p-sorticon field="studentName" /></th>
              <th>Phone</th>
              <th pSortableColumn="batchCode">Batch <p-sorticon field="batchCode" /></th>
              <th pSortableColumn="installmentNo">Inst. <p-sorticon field="installmentNo" /></th>
              <th pSortableColumn="dueDate">Due date <p-sorticon field="dueDate" /></th>
              <th pSortableColumn="daysOverdue">Days overdue <p-sorticon field="daysOverdue" /></th>
              <th pSortableColumn="balance" class="text-right">
                Balance <p-sorticon field="balance" />
              </th>
              <th pSortableColumn="status">Status <p-sorticon field="status" /></th>
              <th class="w-14"><span class="sr-only">Actions</span></th>
            </tr>
          </ng-template>
          <ng-template #body let-d>
            <tr>
              <td>
                <p class="cell-primary">{{ d.studentName }}</p>
                <p class="cell-meta">{{ d.courseName }}</p>
              </td>
              <td class="whitespace-nowrap">{{ d.phone }}</td>
              <td class="mono">{{ d.batchCode }}</td>
              <td>{{ d.installmentNo }}</td>
              <td class="whitespace-nowrap">{{ d.dueDate | appDate }}</td>
              <td>
                @if (d.daysOverdue) {
                  <span class="font-medium text-red-700 tabular-nums"
                    >{{ d.daysOverdue }} days</span
                  >
                } @else {
                  <span class="text-muted">—</span>
                }
              </td>
              <td class="text-right font-semibold tabular-nums">{{ d.balance | inr }}</td>
              <td><app-status-badge [status]="d.status" /></td>
              <td><app-row-actions [actions]="actionsFor(d)" [label]="d.studentName" /></td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="9">
                <app-empty-state
                  icon="circle-check"
                  title="No dues here"
                  message="Nothing outstanding for this view."
                />
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>
  `,
})
export class DuesList {
  private readonly service = inject(FeesService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly views = [
    { label: 'Overdue', value: 'overdue' },
    { label: 'Due in 7 days', value: 'week' },
    { label: 'Due in 30 days', value: 'month' },
    { label: 'All pending', value: 'all' },
  ];
  protected readonly view = signal<DueView>('overdue');
  protected readonly search = signal('');
  protected readonly dues = rxResource({ stream: () => this.service.getDues(), defaultValue: [] });

  protected readonly filtered = computed(() => {
    const today = todayIso();
    const q = this.search().trim().toLowerCase();
    const list = this.dues.hasValue() ? this.dues.value() : [];
    return list.filter((d) => {
      const inView =
        this.view() === 'overdue'
          ? d.status === 'Overdue'
          : this.view() === 'week'
            ? d.status !== 'Overdue' && d.dueDate <= addDays(today, 7)
            : this.view() === 'month'
              ? d.dueDate <= addDays(today, 30)
              : true;
      return (
        inView &&
        (!q || [d.studentName, d.batchCode, d.phone].some((v) => v.toLowerCase().includes(q)))
      );
    });
  });
  protected readonly total = computed(() => this.filtered().reduce((s, d) => s + d.balance, 0));
  protected readonly studentCount = computed(
    () => new Set(this.filtered().map((d) => d.studentId)).size,
  );

  protected actionsFor(d: DueItem): RowAction[] {
    return [
      {
        label: 'Collect payment',
        icon: 'indian-rupee',
        command: () =>
          void this.router.navigate(['/fees/collect'], { queryParams: { student: d.studentId } }),
      },
      {
        label: 'Send reminder',
        icon: 'send',
        command: () =>
          this.toast.success(
            'Reminder queued',
            `SMS & WhatsApp reminder to ${d.studentName} (${d.phone}) — sent once messaging is connected.`,
          ),
      },
      {
        label: 'View student',
        icon: 'eye',
        command: () => void this.router.navigate(['/students', d.studentId]),
      },
    ];
  }

  protected exportCsv(): void {
    downloadCsv(
      'fee-dues',
      [
        { header: 'Student', value: (d: DueItem) => d.studentName },
        { header: 'Student ID', value: (d) => d.studentId },
        { header: 'Phone', value: (d) => d.phone },
        { header: 'Course', value: (d) => d.courseName },
        { header: 'Batch', value: (d) => d.batchCode },
        { header: 'Installment', value: (d) => d.installmentNo },
        { header: 'Due date', value: (d) => d.dueDate },
        { header: 'Days overdue', value: (d) => d.daysOverdue },
        { header: 'Balance', value: (d) => d.balance },
        { header: 'Status', value: (d) => d.status },
      ],
      this.filtered(),
    );
  }
}
