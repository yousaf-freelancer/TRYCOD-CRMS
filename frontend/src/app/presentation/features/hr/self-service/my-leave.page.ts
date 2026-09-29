import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../../../core/auth/auth.service';
import { LeaveRequestView } from '../../../../domain/models';
import { AppDatePipe } from '../../../../shared/pipes/format.pipes';
import { ConfirmService } from '../../../../shared/ui/confirm.service';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header';
import { StatusBadge } from '../../../../shared/ui/status-badge';
import { TableSkeleton } from '../../../../shared/ui/table-skeleton';
import { ToastService } from '../../../../shared/ui/toast.service';
import { LeaveService } from '../../../../data/services/leave.service';
import { LeaveBalanceCards } from '../ui/leave-balance-cards';
import { ApplyLeaveDialog } from './apply-leave-dialog';

@Component({
  selector: 'app-my-leave-page',
  imports: [
    LucideDynamicIcon,
    TableModule,
    PageHeader,
    StatusBadge,
    EmptyState,
    TableSkeleton,
    LeaveBalanceCards,
    ApplyLeaveDialog,
    AppDatePipe,
  ],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header title="My leave" subtitle="Balances for this year and your request history.">
      <button type="button" class="btn btn-primary" (click)="applyOpen.set(true)">
        <svg lucideIcon="plus" size="15" /> Apply for leave
      </button>
    </app-page-header>

    <app-leave-balance-cards [balances]="balances.value()" />

    <div class="table-card mt-6">
      <div class="card-header"><h2 class="card-title">Request history</h2></div>
      @if (requests.isLoading() && !requests.value().length) {
        <app-table-skeleton [rows]="5" [cols]="5" />
      } @else {
        <p-table
          [value]="requests.value()"
          [scrollable]="true"
          [tableStyle]="{ 'min-width': '820px' }"
          [paginator]="requests.value().length > 10"
          [rows]="10"
        >
          <ng-template #header>
            <tr>
              <th>Type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Applied</th>
              <th>Status</th>
              <th class="w-24"></th>
            </tr>
          </ng-template>
          <ng-template #body let-r>
            <tr>
              <td class="cell-primary">{{ r.leaveTypeName }}</td>
              <td class="whitespace-nowrap">
                {{ r.from | appDate: 'dayMonth' }} – {{ r.to | appDate }}
              </td>
              <td class="tabular-nums">{{ r.days }}</td>
              <td class="max-w-64">
                <p class="truncate">{{ r.reason }}</p>
              </td>
              <td class="whitespace-nowrap text-muted">{{ r.appliedOn | appDate }}</td>
              <td>
                <app-status-badge [status]="r.status" />
                @if (r.decisionNote) {
                  <p class="cell-meta mt-0.5 max-w-48 truncate" [title]="r.decisionNote">
                    {{ r.decisionNote }}
                  </p>
                }
              </td>
              <td class="text-right">
                @if (r.status === 'Pending') {
                  <button type="button" class="btn btn-ghost btn-sm" (click)="cancel(r)">
                    Cancel
                  </button>
                }
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="7">
                <app-empty-state
                  icon="plane"
                  title="No leave requests yet"
                  actionLabel="Apply for leave"
                  (action)="applyOpen.set(true)"
                />
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>

    <app-apply-leave-dialog
      [(visible)]="applyOpen"
      [balances]="balances.value()"
      (applied)="reload()"
    />
  `,
})
export class MyLeavePage {
  private readonly service = inject(LeaveService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  private readonly employeeId = computed(() => this.auth.user()?.employeeId ?? '');
  protected readonly applyOpen = signal(false);
  protected readonly balances = rxResource({
    params: () => this.employeeId(),
    stream: ({ params }) => this.service.getBalances(params),
    defaultValue: [],
  });
  protected readonly requests = rxResource({
    params: () => this.employeeId(),
    stream: ({ params }) => this.service.getRequests({ employeeId: params }),
    defaultValue: [],
  });

  protected reload(): void {
    this.balances.reload();
    this.requests.reload();
  }

  protected async cancel(r: LeaveRequestView): Promise<void> {
    const ok = await this.confirm.ask({
      header: 'Cancel leave request?',
      message: `${r.leaveTypeName}, ${r.days} day(s).`,
      acceptLabel: 'Cancel request',
      rejectLabel: 'Keep',
      danger: true,
    });
    if (!ok) return;
    this.service.cancel(r.id).subscribe(() => {
      this.toast.info('Leave request cancelled');
      this.reload();
    });
  }
}
