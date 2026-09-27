import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../../core/auth/auth.service';
import { ENQUIRY_STATUSES, EnquiryStatus, EnquiryView } from '../../../models';
import { AppDatePipe } from '../../../shared/pipes/format.pipes';
import { downloadCsv } from '../../../shared/utils/csv.util';
import { todayIso } from '../../../shared/utils/date.util';
import { ConfirmService } from '../../../shared/ui/confirm.service';
import { EmptyState } from '../../../shared/ui/empty-state';
import { RowAction, RowActions } from '../../../shared/ui/row-actions';
import { SearchInput } from '../../../shared/ui/search-input';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { TableSkeleton } from '../../../shared/ui/table-skeleton';
import { ToastService } from '../../../shared/ui/toast.service';
import { ConvertAdmissionDialog, ConvertSource } from '../convert/convert-admission-dialog';
import { AdmissionsService } from '../data-access/admissions.service';
import { FollowUpFormDialog, FollowUpTarget } from '../follow-ups/follow-up-form-dialog';
import { Scope, ScopeToggle } from '../ui/scope-toggle';
import { EnquiryFormDialog } from './enquiry-form-dialog';

@Component({
  selector: 'app-enquiries-tab',
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
    ScopeToggle,
    EnquiryFormDialog,
    ConvertAdmissionDialog,
    FollowUpFormDialog,
    AppDatePipe,
  ],
  template: `
    <div class="table-card">
      <div class="table-toolbar">
        <app-search-input
          class="w-full sm:w-72"
          [(value)]="search"
          placeholder="Search name, phone, ID…"
        />
        <div class="flex flex-wrap items-center gap-2">
          <p-select
            [options]="statuses"
            [(ngModel)]="status"
            placeholder="All statuses"
            [showClear]="true"
            class="!w-40"
            ariaLabel="Filter by status"
          />
          @if (canToggleScope()) {
            <app-scope-toggle [(value)]="scope" />
          }
          <button type="button" class="btn btn-secondary" (click)="exportCsv()">
            <svg lucideIcon="download" size="15" /> Export
          </button>
          <button type="button" class="btn btn-primary" (click)="openForm(null)">
            <svg lucideIcon="plus" size="15" /> New enquiry
          </button>
        </div>
      </div>

      @if (enquiries.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load enquiries"
          actionLabel="Retry"
          (action)="enquiries.reload()"
        />
      } @else if (enquiries.isLoading() && !enquiries.value().length) {
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
              <th pSortableColumn="id" class="w-28">ID <p-sorticon field="id" /></th>
              <th pSortableColumn="name">Name <p-sorticon field="name" /></th>
              <th>Phone</th>
              <th pSortableColumn="courseName">Course <p-sorticon field="courseName" /></th>
              <th pSortableColumn="source">Source <p-sorticon field="source" /></th>
              <th pSortableColumn="assignedToName">
                Counsellor <p-sorticon field="assignedToName" />
              </th>
              <th pSortableColumn="status">Status <p-sorticon field="status" /></th>
              <th pSortableColumn="enquiryDate">Enquiry date <p-sorticon field="enquiryDate" /></th>
              <th pSortableColumn="nextFollowUp">
                Next follow-up <p-sorticon field="nextFollowUp" />
              </th>
              <th class="w-14"><span class="sr-only">Actions</span></th>
            </tr>
          </ng-template>
          <ng-template #body let-e>
            <tr>
              <td class="mono text-muted">{{ e.id }}</td>
              <td>
                <p class="cell-primary">{{ e.name }}</p>
                @if (e.leadId) {
                  <p class="cell-meta">from {{ e.leadId }}</p>
                }
              </td>
              <td class="whitespace-nowrap">{{ e.phone }}</td>
              <td>{{ e.courseName }}</td>
              <td>{{ e.source }}</td>
              <td>{{ e.assignedToName }}</td>
              <td><app-status-badge [status]="e.status" /></td>
              <td class="whitespace-nowrap">{{ e.enquiryDate | appDate }}</td>
              <td class="whitespace-nowrap">
                @if (e.nextFollowUp) {
                  <span
                    [class.text-red-700]="e.nextFollowUp < today"
                    [class.font-medium]="e.nextFollowUp <= today"
                    >{{ e.nextFollowUp | appDate }}</span
                  >
                } @else {
                  <span class="text-muted">—</span>
                }
              </td>
              <td><app-row-actions [actions]="actionsFor(e)" [label]="e.name" /></td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="10">
                <app-empty-state
                  icon="messages-square"
                  title="No enquiries found"
                  message="Try a different filter or record a new walk-in enquiry."
                  actionLabel="New enquiry"
                  actionIcon="plus"
                  (action)="openForm(null)"
                />
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>

    <app-enquiry-form-dialog
      [(visible)]="formOpen"
      [enquiry]="editing()"
      (saved)="enquiries.reload()"
    />
    <app-convert-admission-dialog
      [(visible)]="convertOpen"
      [source]="convertSource()"
      (converted)="enquiries.reload()"
    />
    <app-follow-up-form-dialog
      [(visible)]="followUpOpen"
      [target]="followUpTarget()"
      (saved)="enquiries.reload()"
    />
  `,
})
export class EnquiriesTab {
  private readonly service = inject(AdmissionsService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly today = todayIso();
  protected readonly statuses = [...ENQUIRY_STATUSES];
  protected readonly search = signal('');
  protected readonly status = signal<EnquiryStatus | null>(null);
  protected readonly canToggleScope = computed(() => this.auth.role() !== 'Admin');
  protected readonly scope = signal<Scope>(this.auth.role() === 'Admin' ? 'all' : 'mine');

  protected readonly enquiries = rxResource({
    params: () => ({
      assignedTo: this.scope() === 'mine' ? (this.auth.user()?.employeeId ?? null) : null,
    }),
    stream: ({ params }) => this.service.getEnquiries(params),
    defaultValue: [],
  });

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.enquiries.hasValue() ? this.enquiries.value() : [];
    return list.filter(
      (e) =>
        (!this.status() || e.status === this.status()) &&
        (!q || [e.name, e.phone, e.id].some((v) => v.toLowerCase().includes(q))),
    );
  });

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<EnquiryView | null>(null);
  protected readonly convertOpen = signal(false);
  protected readonly convertSource = signal<ConvertSource | null>(null);
  protected readonly followUpOpen = signal(false);
  protected readonly followUpTarget = signal<FollowUpTarget | null>(null);

  protected openForm(e: EnquiryView | null): void {
    this.editing.set(e);
    this.formOpen.set(true);
  }

  protected actionsFor(e: EnquiryView): RowAction[] {
    const open = e.status !== 'Converted' && e.status !== 'Closed';
    return [
      { label: 'Edit enquiry', icon: 'pencil', command: () => this.openForm(e) },
      {
        label: 'Schedule follow-up',
        icon: 'calendar-plus',
        visible: open,
        command: () => {
          this.followUpTarget.set({
            relatedType: 'Enquiry',
            relatedId: e.id,
            name: e.name,
            phone: e.phone,
            courseId: e.courseId,
            assignedTo: e.assignedTo,
          });
          this.followUpOpen.set(true);
        },
      },
      {
        label: 'Convert to admission',
        icon: 'user-check',
        visible: open && this.auth.hasRole('Admin', 'Advisor'),
        command: () => {
          this.convertSource.set({
            type: 'Enquiry',
            id: e.id,
            name: e.name,
            phone: e.phone,
            email: e.email,
            courseId: e.courseId,
          });
          this.convertOpen.set(true);
        },
      },
      { label: 'Close enquiry', icon: 'circle-x', visible: open, command: () => this.close(e) },
      { label: 'Delete', icon: 'trash', danger: true, command: () => this.remove(e) },
    ];
  }

  private async close(e: EnquiryView): Promise<void> {
    const ok = await this.confirm.ask({
      header: 'Close enquiry?',
      message: `${e.name}'s enquiry will be marked as closed.`,
      acceptLabel: 'Close enquiry',
    });
    if (!ok) return;
    this.service.updateEnquiry(e.id, { status: 'Closed', nextFollowUp: null }).subscribe(() => {
      this.toast.info('Enquiry closed', e.name);
      this.enquiries.reload();
    });
  }

  private async remove(e: EnquiryView): Promise<void> {
    const ok = await this.confirm.ask({
      header: 'Delete enquiry?',
      message: `This permanently removes ${e.id}.`,
      acceptLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.service.deleteEnquiry(e.id).subscribe(() => {
      this.toast.success('Enquiry deleted');
      this.enquiries.reload();
    });
  }

  protected exportCsv(): void {
    downloadCsv(
      'enquiries',
      [
        { header: 'ID', value: (e: EnquiryView) => e.id },
        { header: 'Name', value: (e) => e.name },
        { header: 'Phone', value: (e) => e.phone },
        { header: 'Course', value: (e) => e.courseName },
        { header: 'Source', value: (e) => e.source },
        { header: 'Counsellor', value: (e) => e.assignedToName },
        { header: 'Status', value: (e) => e.status },
        { header: 'Enquiry date', value: (e) => e.enquiryDate },
        { header: 'Next follow-up', value: (e) => e.nextFollowUp },
      ],
      this.filtered(),
    );
  }
}
