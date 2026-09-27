import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../core/auth/auth.service';
import { EmptyState } from '../../shared/ui/empty-state';
import { PageHeader } from '../../shared/ui/page-header';
import { FeesService } from '../fees/data-access/fees.service';
import { FeeAccountView } from '../fees/ui/fee-account-view';

@Component({
  selector: 'app-portal-fees-page',
  imports: [SkeletonModule, PageHeader, EmptyState, FeeAccountView],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header title="My fees" subtitle="Installments, payments and downloadable receipts." />
    @if (account.error()) {
      <div class="card">
        <app-empty-state
          variant="error"
          title="Couldn't load fees"
          actionLabel="Retry"
          (action)="account.reload()"
        />
      </div>
    } @else if (account.value(); as a) {
      <app-fee-account-view [account]="a" [showCollect]="false" receiptBase="/portal/receipt" />
      <p class="mt-4 text-xs text-muted">
        Pay at the front desk (cash / card / UPI) or by bank transfer. Online payment will be
        available soon.
      </p>
    } @else if (account.isLoading()) {
      <div class="card card-pad space-y-3">
        <p-skeleton height="5rem" /><p-skeleton height="12rem" />
      </div>
    } @else {
      <div class="card"><app-empty-state icon="wallet" title="No fee plan found" /></div>
    }
  `,
})
export class PortalFeesPage {
  private readonly fees = inject(FeesService);
  private readonly auth = inject(AuthService);
  protected readonly account = rxResource({
    params: () => this.auth.user()?.studentId ?? '',
    stream: ({ params }) => this.fees.getFeeAccount(params),
  });
}
