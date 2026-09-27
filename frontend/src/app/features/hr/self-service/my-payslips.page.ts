import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../../core/auth/auth.service';
import { AppDatePipe, InrPipe } from '../../../shared/pipes/format.pipes';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { PayrollService } from '../data-access/payroll.service';

@Component({
  selector: 'app-my-payslips-page',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    SkeletonModule,
    PageHeader,
    StatusBadge,
    EmptyState,
    InrPipe,
    AppDatePipe,
  ],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header title="My payslips" subtitle="Download or print your monthly payslips." />
    @if (payslips.error()) {
      <div class="card">
        <app-empty-state
          variant="error"
          title="Couldn't load payslips"
          actionLabel="Retry"
          (action)="payslips.reload()"
        />
      </div>
    } @else if (payslips.isLoading() && !payslips.value().length) {
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (i of [1, 2, 3]; track i) {
          <div class="card card-pad"><p-skeleton height="6rem" /></div>
        }
      </div>
    } @else {
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (p of payslips.value(); track p.month; let first = $first) {
          <article
            class="card card-pad flex flex-col"
            [class.!border-neutral-950]="first && p.status === 'Processed'"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-muted">Payslip</p>
                <h2 class="text-base font-semibold">{{ p.month | appDate: 'monthLong' }}</h2>
              </div>
              <app-status-badge
                [status]="p.status === 'Draft' ? 'Pending' : p.status"
                [label]="p.status === 'Draft' ? 'In progress' : 'Released'"
              />
            </div>
            <p class="mt-4 text-2xl font-semibold tracking-tight tabular-nums">
              {{ p.netPay | inr }}
            </p>
            <p class="text-xs text-muted">
              Net pay · Gross {{ p.gross | inr }} · Deductions {{ p.deductions | inr }}
            </p>
            <div class="mt-5 flex gap-2 border-t border-line pt-4">
              @if (p.status === 'Processed') {
                <a [routerLink]="['/me/payslips', p.month]" class="btn btn-secondary btn-sm flex-1"
                  ><svg lucideIcon="eye" size="14" /> View</a
                >
                <a [routerLink]="['/me/payslips', p.month]" class="btn btn-ghost btn-sm"
                  ><svg lucideIcon="printer" size="14" /> Print</a
                >
              } @else {
                <p class="text-xs text-muted">Available after payroll is processed at month end.</p>
              }
            </div>
          </article>
        } @empty {
          <div class="card sm:col-span-2 xl:col-span-3">
            <app-empty-state icon="receipt" title="No payslips yet" />
          </div>
        }
      </div>
    }
  `,
})
export class MyPayslipsPage {
  private readonly payroll = inject(PayrollService);
  private readonly auth = inject(AuthService);
  private readonly employeeId = computed(() => this.auth.user()?.employeeId ?? '');
  protected readonly payslips = rxResource({
    params: () => this.employeeId(),
    stream: ({ params }) => this.payroll.getEmployeePayslips(params),
    defaultValue: [],
  });
}
