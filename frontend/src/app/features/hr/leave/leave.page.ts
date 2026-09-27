import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { LeaveRequestView, LeaveStatus, LeaveType } from '../../../models';
import { AppDatePipe } from '../../../shared/pipes/format.pipes';
import { todayIso } from '../../../shared/utils/date.util';
import { Avatar } from '../../../shared/ui/avatar';
import { ConfirmService } from '../../../shared/ui/confirm.service';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { RowAction, RowActions } from '../../../shared/ui/row-actions';
import { SearchInput } from '../../../shared/ui/search-input';
import { StatCard } from '../../../shared/ui/stat-card';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { TableSkeleton } from '../../../shared/ui/table-skeleton';
import { ToastService } from '../../../shared/ui/toast.service';
import { LeaveService } from '../data-access/leave.service';
import { LeaveDecisionDialog } from './leave-decision-dialog';
import { LeaveTypeDialog } from './leave-type-dialog';

@Component({
  selector: 'app-leave-page',
  imports: [
    FormsModule,
    LucideDynamicIcon,
    TabsModule,
    TableModule,
    SelectButtonModule,
    PageHeader,
    StatCard,
    SearchInput,
    Avatar,
    StatusBadge,
    EmptyState,
    TableSkeleton,
    RowActions,
    LeaveDecisionDialog,
    LeaveTypeDialog,
    AppDatePipe,
  ],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header
      title="Leave management"
      subtitle="Approve requests, track balances and configure leave types."
    />

    <section class="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <app-stat-card
        label="Pending approval"
        [value]="count('Pending')"
        icon="hourglass"
        hint="requests"
      />
      <app-stat-card
        label="On leave today"
        [value]="onLeaveToday()"
        icon="plane"
        hint="approved leave"
      />
      <app-stat-card
        label="Approved this month"
        [value]="approvedThisMonth()"
        icon="circle-check"
        hint="requests"
      />
      <app-stat-card label="Rejected" [value]="count('Rejected')" icon="circle-x" hint="all time" />
    </section>

    <p-tabs [(value)]="tab" [scrollable]="true">
      <p-tablist>
        <p-tab value="requests">Requests</p-tab>
        <p-tab value="balances">Balances</p-tab>
        <p-tab value="types">Leave types</p-tab>
      </p-tablist>
      <p-tabpanels class="!bg-transparent !px-0 !pt-5">
        <p-tabpanel value="requests">
          <div class="table-card">
            <div class="table-toolbar">
              <app-search-input
                class="w-full sm:w-64"
                [(value)]="search"
                placeholder="Search employee…"
              />
              <p-selectbutton
                [options]="statusOptions"
                optionLabel="label"
                optionValue="value"
                [(ngModel)]="status"
                [allowEmpty]="false"
                size="small"
                ariaLabelledBy="lv-status"
              />
              <span id="lv-status" class="sr-only">Filter by status</span>
            </div>
            @if (requests.error()) {
              <app-empty-state
                variant="error"
                title="Couldn't load requests"
                actionLabel="Retry"
                (action)="requests.reload()"
              />
            } @else if (requests.isLoading() && !requests.value().length) {
              <app-table-skeleton [rows]="6" [cols]="6" />
            } @else {
              <p-table
                [value]="filteredRequests()"
                dataKey="id"
                [rowHover]="true"
                [paginator]="true"
                [rows]="10"
                [scrollable]="true"
                [tableStyle]="{ 'min-width': '980px' }"
              >
                <ng-template #header>
                  <tr>
                    <th pSortableColumn="employeeName">
                      Employee <p-sorticon field="employeeName" />
                    </th>
                    <th pSortableColumn="leaveTypeName">
                      Type <p-sorticon field="leaveTypeName" />
                    </th>
                    <th pSortableColumn="from">Dates <p-sorticon field="from" /></th>
                    <th pSortableColumn="days">Days <p-sorticon field="days" /></th>
                    <th>Reason</th>
                    <th pSortableColumn="appliedOn">Applied <p-sorticon field="appliedOn" /></th>
                    <th pSortableColumn="status">Status <p-sorticon field="status" /></th>
                    <th class="w-44"><span class="sr-only">Actions</span></th>
                  </tr>
                </ng-template>
                <ng-template #body let-r>
                  <tr>
                    <td>
                      <div class="flex items-center gap-3">
                        <app-avatar [name]="r.employeeName" size="sm" />
                        <div>
                          <p class="cell-primary whitespace-nowrap">{{ r.employeeName }}</p>
                          <p class="cell-meta">{{ r.department }}</p>
                        </div>
                      </div>
                    </td>
                    <td>{{ r.leaveTypeName }}</td>
                    <td class="whitespace-nowrap">
                      {{ r.from | appDate: 'dayMonth' }} – {{ r.to | appDate }}
                    </td>
                    <td class="tabular-nums">{{ r.days }}{{ r.halfDay ? ' (half)' : '' }}</td>
                    <td class="max-w-56">
                      <p class="truncate" [title]="r.reason">{{ r.reason }}</p>
                    </td>
                    <td class="whitespace-nowrap text-muted">{{ r.appliedOn | appDate }}</td>
                    <td>
                      <app-status-badge [status]="r.status" />
                      @if (r.decidedByName) {
                        <p class="cell-meta mt-0.5">by {{ r.decidedByName }}</p>
                      }
                    </td>
                    <td>
                      @if (r.status === 'Pending') {
                        <div class="flex justify-end gap-1.5">
                          <button
                            type="button"
                            class="btn btn-secondary btn-sm"
                            (click)="decide(r, 'Rejected')"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            class="btn btn-primary btn-sm"
                            (click)="decide(r, 'Approved')"
                          >
                            Approve
                          </button>
                        </div>
                      }
                    </td>
                  </tr>
                </ng-template>
                <ng-template #emptymessage>
                  <tr>
                    <td colspan="8">
                      <app-empty-state
                        icon="plane"
                        [title]="status() === 'Pending' ? 'No pending requests' : 'No requests'"
                        message="You're all caught up."
                      />
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            }
          </div>
        </p-tabpanel>

        <p-tabpanel value="balances">
          <div class="table-card">
            <p-table
              [value]="balances.value()"
              [scrollable]="true"
              scrollHeight="62vh"
              [tableStyle]="{ 'min-width': '860px' }"
              [loading]="balances.isLoading()"
            >
              <ng-template #header>
                <tr>
                  <th>Employee</th>
                  @for (t of types.value(); track t.id) {
                    <th class="text-center">
                      {{ t.code
                      }}<span class="block text-[10px] font-normal text-muted">{{
                        t.annualQuota ? t.annualQuota + ' / yr' : 'unpaid'
                      }}</span>
                    </th>
                  }
                </tr>
              </ng-template>
              <ng-template #body let-row>
                <tr>
                  <td>
                    <p class="cell-primary">{{ row.employeeName }}</p>
                    <p class="cell-meta">{{ row.department }}</p>
                  </td>
                  @for (b of row.balances; track b.leaveTypeId) {
                    <td class="text-center tabular-nums">
                      @if (b.quota) {
                        <span class="font-semibold">{{ b.available }}</span
                        ><span class="text-muted"> left</span>
                        <span class="block text-[11px] text-muted"
                          >{{ b.used }} used{{
                            b.pending ? ' · ' + b.pending + ' pending' : ''
                          }}</span
                        >
                      } @else {
                        <span class="text-muted">{{ b.used }} taken</span>
                      }
                    </td>
                  }
                </tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabpanel>

        <p-tabpanel value="types">
          <div class="table-card">
            <div class="table-toolbar">
              <p class="text-[13px] text-muted">Quotas reset every academic year (June).</p>
              <button type="button" class="btn btn-primary" (click)="openType(null)">
                <svg lucideIcon="plus" size="15" /> Add leave type
              </button>
            </div>
            <p-table [value]="types.value()" [tableStyle]="{ 'min-width': '720px' }">
              <ng-template #header>
                <tr>
                  <th>Leave type</th>
                  <th>Code</th>
                  <th>Days / year</th>
                  <th>Paid</th>
                  <th>Carry forward</th>
                  <th class="w-14"></th>
                </tr>
              </ng-template>
              <ng-template #body let-t>
                <tr>
                  <td>
                    <p class="cell-primary">{{ t.name }}</p>
                    <p class="cell-meta">{{ t.description }}</p>
                  </td>
                  <td class="mono">{{ t.code }}</td>
                  <td class="tabular-nums">{{ t.annualQuota || '—' }}</td>
                  <td>{{ t.paid ? 'Yes' : 'No' }}</td>
                  <td>{{ t.carryForward ? 'Yes' : 'No' }}</td>
                  <td><app-row-actions [actions]="typeActions(t)" [label]="t.name" /></td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabpanel>
      </p-tabpanels>
    </p-tabs>

    <app-leave-decision-dialog
      [(visible)]="decisionOpen"
      [request]="selected()"
      [decision]="decision()"
      (done)="reloadAll()"
    />
    <app-leave-type-dialog
      [(visible)]="typeOpen"
      [type]="editingType()"
      (saved)="types.reload(); balances.reload()"
    />
  `,
})
export class LeavePage {
  private readonly service = inject(LeaveService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly tab = signal<string | number | undefined>('requests');
  protected readonly statusOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'All', value: 'All' },
  ];
  protected readonly status = signal<LeaveStatus | 'All'>('Pending');
  protected readonly search = signal('');

  protected readonly requests = rxResource({
    stream: () => this.service.getRequests(),
    defaultValue: [],
  });
  protected readonly balances = rxResource({
    stream: () => this.service.getAllBalances(),
    defaultValue: [],
  });
  protected readonly types = rxResource({
    stream: () => this.service.getLeaveTypes(),
    defaultValue: [],
  });

  private readonly list = computed(() => (this.requests.hasValue() ? this.requests.value() : []));
  protected readonly filteredRequests = computed(() => {
    const q = this.search().toLowerCase();
    return this.list().filter(
      (r) =>
        (this.status() === 'All' || r.status === this.status()) &&
        (!q || r.employeeName.toLowerCase().includes(q)),
    );
  });
  protected readonly onLeaveToday = computed(() => {
    const t = todayIso();
    return this.list().filter((r) => r.status === 'Approved' && r.from <= t && r.to >= t).length;
  });
  protected readonly approvedThisMonth = computed(() => {
    const m = todayIso().slice(0, 7);
    return this.list().filter((r) => r.status === 'Approved' && r.from.startsWith(m)).length;
  });

  protected count(status: LeaveStatus): number {
    return this.list().filter((r) => r.status === status).length;
  }

  protected readonly decisionOpen = signal(false);
  protected readonly selected = signal<LeaveRequestView | null>(null);
  protected readonly decision = signal<'Approved' | 'Rejected'>('Approved');
  protected readonly typeOpen = signal(false);
  protected readonly editingType = signal<LeaveType | null>(null);

  protected decide(r: LeaveRequestView, decision: 'Approved' | 'Rejected'): void {
    this.selected.set(r);
    this.decision.set(decision);
    this.decisionOpen.set(true);
  }

  protected reloadAll(): void {
    this.requests.reload();
    this.balances.reload();
  }

  protected openType(t: LeaveType | null): void {
    this.editingType.set(t);
    this.typeOpen.set(true);
  }

  protected typeActions(t: LeaveType): RowAction[] {
    return [
      { label: 'Edit', icon: 'pencil', command: () => this.openType(t) },
      { label: 'Delete', icon: 'trash', danger: true, command: () => this.removeType(t) },
    ];
  }

  private async removeType(t: LeaveType): Promise<void> {
    const ok = await this.confirm.ask({
      header: 'Delete leave type?',
      message: `Remove ${t.name}?`,
      acceptLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.service.deleteLeaveType(t.id).subscribe({
      next: () => {
        this.toast.success('Leave type deleted', t.name);
        this.types.reload();
        this.balances.reload();
      },
      error: (e: Error) => this.toast.error('Cannot delete', e.message),
    });
  }
}
