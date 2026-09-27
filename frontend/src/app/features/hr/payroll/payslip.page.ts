import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../../core/auth/auth.service';
import { EmptyState } from '../../../shared/ui/empty-state';
import { SettingsService } from '../../settings/data-access/settings.service';
import { PayrollService } from '../data-access/payroll.service';
import { PayslipView } from '../ui/payslip-view';

/** Printable payslip. Admin: /hr/payslip/:employeeId/:month · Staff: /me/payslips/:month. */
@Component({
  selector: 'app-payslip-page',
  imports: [LucideDynamicIcon, SkeletonModule, EmptyState, PayslipView],
  host: { class: 'block page-enter' },
  template: `
    <div class="no-print mx-auto mb-5 flex max-w-[800px] items-center justify-between">
      <button type="button" class="btn btn-ghost -ml-3" (click)="location.back()">
        <svg lucideIcon="arrow-left" size="15" /> Back
      </button>
      <button type="button" class="btn btn-primary" (click)="print()" [disabled]="!payslip.value()">
        <svg lucideIcon="printer" size="15" /> Print payslip
      </button>
    </div>
    @if (payslip.error()) {
      <div class="card mx-auto max-w-[800px]">
        <app-empty-state
          variant="error"
          title="Couldn't load payslip"
          actionLabel="Retry"
          (action)="payslip.reload()"
        />
      </div>
    } @else if (payslip.isLoading()) {
      <div class="card card-pad mx-auto max-w-[800px] space-y-4">
        <p-skeleton height="3rem" /><p-skeleton height="16rem" />
      </div>
    } @else if (payslip.value(); as p) {
      @if (settings.value(); as s) {
        <app-payslip-view [payslip]="p" [institute]="s.institute" />
      }
    } @else {
      <div class="card mx-auto max-w-[800px]">
        <app-empty-state
          icon="receipt"
          title="Payslip not available"
          message="No payroll entry exists for this month."
        />
      </div>
    }
  `,
})
export class PayslipPage {
  private readonly payroll = inject(PayrollService);
  private readonly settingsService = inject(SettingsService);
  private readonly auth = inject(AuthService);
  protected readonly location = inject(Location);

  /** Admin route supplies employeeId; self-service falls back to the signed-in user. */
  readonly employeeId = input<string>();
  readonly month = input.required<string>();

  protected readonly payslip = rxResource({
    params: () => ({
      employeeId: this.employeeId() ?? this.auth.user()?.employeeId ?? '',
      month: this.month(),
    }),
    stream: ({ params }) => this.payroll.getPayslip(params.employeeId, params.month),
  });
  protected readonly settings = rxResource({ stream: () => this.settingsService.getSettings() });

  protected print(): void {
    window.print();
  }
}
