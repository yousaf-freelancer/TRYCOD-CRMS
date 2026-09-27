import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { AdmissionStatus, AdmissionView } from '../../../models';
import { AppDatePipe, InrPipe } from '../../../shared/pipes/format.pipes';
import { downloadCsv } from '../../../shared/utils/csv.util';
import { ConfirmService } from '../../../shared/ui/confirm.service';
import { EmptyState } from '../../../shared/ui/empty-state';
import { RowAction, RowActions } from '../../../shared/ui/row-actions';
import { SearchInput } from '../../../shared/ui/search-input';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { TableSkeleton } from '../../../shared/ui/table-skeleton';
import { ToastService } from '../../../shared/ui/toast.service';
import { ConvertAdmissionDialog } from '../convert/convert-admission-dialog';
import { AdmissionsService } from '../data-access/admissions.service';

@Component({
  selector: 'app-admissions-tab',
  imports: [
    FormsModule,
    LucideDynamicIcon,
    TableModule,
    SelectModule,
    SearchInput,
    StatusBadge,
    EmptyState,
    TableSkeleton,
    RowActions,
    ConvertAdmissionDialog,
    AppDatePipe,
    InrPipe,
  ],
  template: `
    <div class="table-card">
      <div class="table-toolbar">
        <app-search-input
          class="w-full sm:w-72"
          [(value)]="search"
          placeholder="Search student, ID, batch…"
        />
        <div class="flex flex-wrap items-center gap-2">
          <p-select
            [options]="statuses"
            [(ngModel)]="status"
            placeholder="All statuses"
            [showClear]="true"
            class="!w-48"
            ariaLabel="Filter by status"
          />
          <button type="button" class="btn btn-secondary" (click)="exportCsv()">
            <svg lucideIcon="download" size="15" /> Export
          </button>
          <button type="button" class="btn btn-primary" (click)="convertOpen.set(true)">
            <svg lucideIcon="plus" size="15" /> New admission
          </button>
        </div>
      </div>

      @if (admissions.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load admissions"
          actionLabel="Retry"
          (action)="admissions.reload()"
        />
      } @else if (admissions.isLoading() && !admissions.value().length) {
        <app-table-skeleton [rows]="8" [cols]="7" />
      } @else {
        <p-table
          [value]="filtered()"
          dataKey="id"
          [rowHover]="true"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [scrollable]="true"
          scrollHeight="62vh"
          [tableStyle]="{ 'min-width': '1040px' }"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="{first}–{last} of {totalRecords}"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="id" class="w-28">Admission <p-sorticon field="id" /></th>
              <th pSortableColumn="studentName">Student <p-sorticon field="studentName" /></th>
              <th pSortableColumn="courseName">Course <p-sorticon field="courseName" /></th>
              <th pSortableColumn="batchCode">Batch <p-sorticon field="batchCode" /></th>
              <th pSortableColumn="admissionDate">Date <p-sorticon field="admissionDate" /></th>
              <th pSortableColumn="advisorName">Advisor <p-sorticon field="advisorName" /></th>
              <th pSortableColumn="feePlan">Fee plan <p-sorticon field="feePlan" /></th>
              <th pSortableColumn="status">Status <p-sorticon field="status" /></th>
              <th class="w-14"><span class="sr-only">Actions</span></th>
            </tr>
          </ng-template>
          <ng-template #body let-a>
            <tr>
              <td class="mono text-muted">{{ a.id }}</td>
              <td>
                <p class="cell-primary">{{ a.studentName }}</p>
                <p class="cell-meta">{{ a.studentId }}</p>
              </td>
              <td>{{ a.courseName }}</td>
              <td class="mono">{{ a.batchCode }}</td>
              <td class="whitespace-nowrap">{{ a.admissionDate | appDate }}</td>
              <td>{{ a.advisorName }}</td>
              <td>
                <p>{{ a.feePlan }}</p>
                <p class="cell-meta">{{ a.netFee | inr }}</p>
              </td>
              <td><app-status-badge [status]="a.status" /></td>
              <td><app-row-actions [actions]="actionsFor(a)" [label]="a.studentName" /></td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="9">
                <app-empty-state
                  icon="user-check"
                  title="No admissions found"
                  message="Convert a lead or enquiry, or create a direct admission."
                />
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>

    <app-convert-admission-dialog
      [(visible)]="convertOpen"
      [source]="null"
      (converted)="admissions.reload()"
    />
  `,
})
export class AdmissionsTab {
  private readonly service = inject(AdmissionsService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly statuses: AdmissionStatus[] = ['Confirmed', 'Pending Documents', 'Cancelled'];
  protected readonly search = signal('');
  protected readonly status = signal<AdmissionStatus | null>(null);
  protected readonly convertOpen = signal(false);

  protected readonly admissions = rxResource({
    stream: () => this.service.getAdmissions(),
    defaultValue: [],
  });
  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.admissions.hasValue() ? this.admissions.value() : [];
    return list.filter(
      (a) =>
        (!this.status() || a.status === this.status()) &&
        (!q ||
          [a.studentName, a.id, a.studentId, a.batchCode].some((v) => v.toLowerCase().includes(q))),
    );
  });

  protected actionsFor(a: AdmissionView): RowAction[] {
    return [
      {
        label: 'View student',
        icon: 'eye',
        command: () => void this.router.navigate(['/students', a.studentId]),
      },
      {
        label: 'Collect fee',
        icon: 'indian-rupee',
        visible: a.status !== 'Cancelled',
        command: () =>
          void this.router.navigate(['/fees/collect'], { queryParams: { student: a.studentId } }),
      },
      {
        label: 'Mark documents received',
        icon: 'file-check',
        visible: a.status === 'Pending Documents',
        command: () => this.setStatus(a, 'Confirmed'),
      },
      {
        label: 'Cancel admission',
        icon: 'circle-x',
        danger: true,
        visible: a.status !== 'Cancelled',
        command: () => this.cancel(a),
      },
    ];
  }

  private setStatus(a: AdmissionView, status: AdmissionStatus): void {
    this.service.updateAdmissionStatus(a.id, status).subscribe(() => {
      this.toast.success('Admission updated', `${a.studentName} · ${status}`);
      this.admissions.reload();
    });
  }

  private async cancel(a: AdmissionView): Promise<void> {
    const ok = await this.confirm.ask({
      header: 'Cancel admission?',
      message: `${a.studentName} will be marked as dropped. Fee records are kept for accounting.`,
      acceptLabel: 'Cancel admission',
      rejectLabel: 'Keep',
      danger: true,
    });
    if (ok) this.setStatus(a, 'Cancelled');
  }

  protected exportCsv(): void {
    downloadCsv(
      'admissions',
      [
        { header: 'Admission ID', value: (a: AdmissionView) => a.id },
        { header: 'Student', value: (a) => a.studentName },
        { header: 'Student ID', value: (a) => a.studentId },
        { header: 'Course', value: (a) => a.courseName },
        { header: 'Batch', value: (a) => a.batchCode },
        { header: 'Date', value: (a) => a.admissionDate },
        { header: 'Advisor', value: (a) => a.advisorName },
        { header: 'Fee plan', value: (a) => a.feePlan },
        { header: 'Net fee', value: (a) => a.netFee },
        { header: 'Status', value: (a) => a.status },
      ],
      this.filtered(),
    );
  }
}
