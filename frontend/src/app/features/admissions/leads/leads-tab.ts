import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../../core/auth/auth.service';
import { LEAD_SOURCES, LEAD_STATUSES, LeadSource, LeadStatus, LeadView } from '../../../models';
import { AppDatePipe } from '../../../shared/pipes/format.pipes';
import { downloadCsv } from '../../../shared/utils/csv.util';
import { ConfirmService } from '../../../shared/ui/confirm.service';
import { EmptyState } from '../../../shared/ui/empty-state';
import { RowAction, RowActions } from '../../../shared/ui/row-actions';
import { SearchInput } from '../../../shared/ui/search-input';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { TableSkeleton } from '../../../shared/ui/table-skeleton';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdmissionsService } from '../data-access/admissions.service';
import { ConvertAdmissionDialog, ConvertSource } from '../convert/convert-admission-dialog';
import { FollowUpFormDialog, FollowUpTarget } from '../follow-ups/follow-up-form-dialog';
import { Scope, ScopeToggle } from '../ui/scope-toggle';
import { LeadFormDialog } from './lead-form-dialog';

@Component({
  selector: 'app-leads-tab',
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
    LeadFormDialog,
    ConvertAdmissionDialog,
    FollowUpFormDialog,
    AppDatePipe,
  ],
  template: `
    <div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      @for (s of statusCounts(); track s.status) {
        <button
          type="button"
          class="card px-4 py-3 text-left transition-colors hover:border-neutral-400"
          [class.!border-neutral-950]="status() === s.status"
          [attr.aria-pressed]="status() === s.status"
          (click)="status.set(status() === s.status ? null : s.status)"
        >
          <p class="text-xs text-muted">{{ s.status }}</p>
          <p class="mt-1 text-lg font-semibold tabular-nums">{{ s.count }}</p>
        </button>
      }
    </div>

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
          <p-select
            [options]="sources"
            [(ngModel)]="source"
            placeholder="All sources"
            [showClear]="true"
            class="!w-40"
            ariaLabel="Filter by source"
          />
          @if (canToggleScope()) {
            <app-scope-toggle [(value)]="scope" />
          }
          <button type="button" class="btn btn-secondary" (click)="exportCsv()">
            <svg lucideIcon="download" size="15" /> Export
          </button>
          <button type="button" class="btn btn-primary" (click)="openForm(null)">
            <svg lucideIcon="plus" size="15" /> Add lead
          </button>
        </div>
      </div>

      @if (leads.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load leads"
          message="Something went wrong while fetching leads."
          actionLabel="Retry"
          (action)="leads.reload()"
        />
      } @else if (leads.isLoading() && !leads.value().length) {
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
          [tableStyle]="{ 'min-width': '1080px' }"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="{first}–{last} of {totalRecords}"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="id" class="w-28">ID <p-sorticon field="id" /></th>
              <th pSortableColumn="name">Name <p-sorticon field="name" /></th>
              <th>Contact</th>
              <th pSortableColumn="courseName">Course <p-sorticon field="courseName" /></th>
              <th pSortableColumn="source">Source <p-sorticon field="source" /></th>
              <th pSortableColumn="assignedToName">
                Assigned to <p-sorticon field="assignedToName" />
              </th>
              <th pSortableColumn="status">Status <p-sorticon field="status" /></th>
              <th pSortableColumn="createdOn">Created <p-sorticon field="createdOn" /></th>
              <th class="w-14"><span class="sr-only">Actions</span></th>
            </tr>
          </ng-template>
          <ng-template #body let-lead>
            <tr>
              <td class="mono text-muted">{{ lead.id }}</td>
              <td class="cell-primary">{{ lead.name }}</td>
              <td>
                <p>{{ lead.phone }}</p>
                <p class="cell-meta">{{ lead.email || '—' }}</p>
              </td>
              <td>{{ lead.courseName }}</td>
              <td>{{ lead.source }}</td>
              <td>{{ lead.assignedToName }}</td>
              <td><app-status-badge [status]="lead.status" /></td>
              <td class="whitespace-nowrap">{{ lead.createdOn | appDate }}</td>
              <td><app-row-actions [actions]="actionsFor(lead)" [label]="lead.name" /></td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="9">
                <app-empty-state
                  icon="user-plus"
                  title="No leads found"
                  message="Try a different search or filter, or add a new lead."
                  actionLabel="Add lead"
                  actionIcon="plus"
                  (action)="openForm(null)"
                />
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>

    <app-lead-form-dialog [(visible)]="formOpen" [lead]="editing()" (saved)="leads.reload()" />
    <app-convert-admission-dialog
      [(visible)]="convertOpen"
      [source]="convertSource()"
      (converted)="leads.reload()"
    />
    <app-follow-up-form-dialog
      [(visible)]="followUpOpen"
      [target]="followUpTarget()"
      (saved)="leads.reload()"
    />
  `,
})
export class LeadsTab {
  private readonly service = inject(AdmissionsService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly statuses = [...LEAD_STATUSES];
  protected readonly sources = [...LEAD_SOURCES];
  protected readonly search = signal('');
  protected readonly status = signal<LeadStatus | null>(null);
  protected readonly source = signal<LeadSource | null>(null);
  protected readonly canToggleScope = computed(() => this.auth.role() !== 'Admin');
  protected readonly scope = signal<Scope>(this.auth.role() === 'Admin' ? 'all' : 'mine');

  protected readonly leads = rxResource({
    params: () => ({
      assignedTo: this.scope() === 'mine' ? (this.auth.user()?.employeeId ?? null) : null,
    }),
    stream: ({ params }) => this.service.getLeads(params),
    defaultValue: [],
  });

  protected readonly scoped = computed(() => (this.leads.hasValue() ? this.leads.value() : []));
  protected readonly statusCounts = computed(() =>
    this.statuses.map((status) => ({
      status,
      count: this.scoped().filter((l) => l.status === status).length,
    })),
  );
  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.scoped().filter(
      (l) =>
        (!this.status() || l.status === this.status()) &&
        (!this.source() || l.source === this.source()) &&
        (!q || [l.name, l.phone, l.email, l.id].some((v) => v.toLowerCase().includes(q))),
    );
  });

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<LeadView | null>(null);
  protected readonly convertOpen = signal(false);
  protected readonly convertSource = signal<ConvertSource | null>(null);
  protected readonly followUpOpen = signal(false);
  protected readonly followUpTarget = signal<FollowUpTarget | null>(null);

  protected openForm(lead: LeadView | null): void {
    this.editing.set(lead);
    this.formOpen.set(true);
  }

  protected actionsFor(lead: LeadView): RowAction[] {
    const closed = lead.status === 'Converted' || lead.status === 'Lost';
    return [
      { label: 'Edit lead', icon: 'pencil', command: () => this.openForm(lead) },
      {
        label: 'Schedule follow-up',
        icon: 'calendar-plus',
        visible: !closed,
        command: () => {
          this.followUpTarget.set({
            relatedType: 'Lead',
            relatedId: lead.id,
            name: lead.name,
            phone: lead.phone,
            courseId: lead.courseId,
            assignedTo: lead.assignedTo,
          });
          this.followUpOpen.set(true);
        },
      },
      {
        label: 'Move to enquiry',
        icon: 'messages-square',
        visible: !closed && lead.status !== 'Qualified',
        command: () => this.toEnquiry(lead),
      },
      {
        label: 'Convert to admission',
        icon: 'user-check',
        visible: !closed && this.auth.hasRole('Admin', 'Advisor'),
        command: () => {
          this.convertSource.set({
            type: 'Lead',
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            courseId: lead.courseId,
          });
          this.convertOpen.set(true);
        },
      },
      {
        label: 'Mark as lost',
        icon: 'circle-x',
        visible: !closed,
        command: () => this.markLost(lead),
      },
      { label: 'Delete', icon: 'trash', danger: true, command: () => this.remove(lead) },
    ];
  }

  private toEnquiry(lead: LeadView): void {
    this.service
      .createEnquiryFromLead(
        lead.id,
        this.auth.hasRole('Advisor') ? this.auth.user()!.employeeId! : 'EMP-003',
      )
      .subscribe(() => {
        this.toast.success('Moved to enquiries', `${lead.name} is now an enquiry.`);
        this.leads.reload();
      });
  }

  private async markLost(lead: LeadView): Promise<void> {
    const ok = await this.confirm.ask({
      header: 'Mark lead as lost?',
      message: `${lead.name} will be closed and removed from active follow-ups.`,
      acceptLabel: 'Mark lost',
    });
    if (!ok) return;
    this.service.updateLead(lead.id, { status: 'Lost' }).subscribe(() => {
      this.toast.info('Lead marked as lost', lead.name);
      this.leads.reload();
    });
  }

  private async remove(lead: LeadView): Promise<void> {
    const ok = await this.confirm.ask({
      header: 'Delete lead?',
      message: `This permanently removes ${lead.name} (${lead.id}).`,
      acceptLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.service.deleteLead(lead.id).subscribe(() => {
      this.toast.success('Lead deleted');
      this.leads.reload();
    });
  }

  protected exportCsv(): void {
    downloadCsv(
      'leads',
      [
        { header: 'ID', value: (l: LeadView) => l.id },
        { header: 'Name', value: (l) => l.name },
        { header: 'Phone', value: (l) => l.phone },
        { header: 'Email', value: (l) => l.email },
        { header: 'Course', value: (l) => l.courseName },
        { header: 'Source', value: (l) => l.source },
        { header: 'Assigned to', value: (l) => l.assignedToName },
        { header: 'Status', value: (l) => l.status },
        { header: 'Created', value: (l) => l.createdOn },
      ],
      this.filtered(),
    );
  }
}
