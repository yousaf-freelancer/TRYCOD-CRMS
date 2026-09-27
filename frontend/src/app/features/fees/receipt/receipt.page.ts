import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../../core/auth/auth.service';
import { EmptyState } from '../../../shared/ui/empty-state';
import { SettingsService } from '../../settings/data-access/settings.service';
import { FeesService } from '../data-access/fees.service';
import { ReceiptView } from './receipt-view';

/** Printable receipt (staff: /fees/receipt/:id, student: /portal/receipt/:id). */
@Component({
  selector: 'app-receipt-page',
  imports: [LucideDynamicIcon, SkeletonModule, EmptyState, ReceiptView],
  host: { class: 'block page-enter' },
  template: `
    <div class="no-print mx-auto mb-5 flex max-w-[760px] items-center justify-between gap-3">
      <button type="button" class="btn btn-ghost -ml-3" (click)="back()">
        <svg lucideIcon="arrow-left" size="15" /> Back
      </button>
      <div class="flex gap-2">
        <button
          type="button"
          class="btn btn-primary"
          (click)="print()"
          [disabled]="!receipt.value()"
        >
          <svg lucideIcon="printer" size="15" /> Print receipt
        </button>
      </div>
    </div>
    @if (receipt.error()) {
      <div class="card mx-auto max-w-[760px]">
        <app-empty-state
          variant="error"
          title="Couldn't load receipt"
          actionLabel="Retry"
          (action)="receipt.reload()"
        />
      </div>
    } @else if (receipt.isLoading()) {
      <div class="card card-pad mx-auto max-w-[760px] space-y-4">
        <p-skeleton height="3rem" /><p-skeleton height="14rem" />
      </div>
    } @else if (receipt.value(); as r) {
      @if (!allowed(r.payment.studentId)) {
        <div class="card mx-auto max-w-[760px]">
          <app-empty-state
            icon="shield-x"
            title="Receipt not available"
            message="You can only view your own receipts."
          />
        </div>
      } @else if (settings.value(); as s) {
        <app-receipt-view [receipt]="r" [institute]="s.institute" />
      }
    } @else {
      <div class="card mx-auto max-w-[760px]">
        <app-empty-state icon="receipt" title="Receipt not found" />
      </div>
    }
  `,
})
export class ReceiptPage {
  private readonly fees = inject(FeesService);
  private readonly settingsService = inject(SettingsService);
  private readonly location = inject(Location);
  private readonly auth = inject(AuthService);

  readonly id = input.required<string>();
  protected readonly receipt = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.fees.getReceipt(params),
  });
  protected readonly settings = rxResource({ stream: () => this.settingsService.getSettings() });
  private readonly studentId = computed(() => this.auth.user()?.studentId ?? null);

  protected allowed(studentId: string): boolean {
    return !this.auth.isStudent() || this.studentId() === studentId;
  }

  protected print(): void {
    window.print();
  }

  protected back(): void {
    this.location.back();
  }
}
