import { Component, input } from '@angular/core';
import { LeaveBalance } from '../../../models';
import { Meter } from '../../../shared/ui/meter';

@Component({
  selector: 'app-leave-balance-cards',
  imports: [Meter],
  host: { class: 'grid gap-4 sm:grid-cols-2 xl:grid-cols-5' },
  template: `
    @for (b of balances(); track b.leaveTypeId) {
      <div class="card card-pad">
        <div class="flex items-center justify-between">
          <p class="text-[13px] font-medium">{{ b.leaveTypeName }}</p>
          <span class="mono text-muted">{{ b.code }}</span>
        </div>
        @if (b.quota) {
          <p class="mt-2 text-2xl font-semibold tabular-nums">
            {{ b.available }}<span class="text-sm font-normal text-muted"> / {{ b.quota }}</span>
          </p>
          <app-meter
            class="mt-2"
            [value]="usedPct(b)"
            [showValue]="false"
            [thresholds]="false"
            ariaLabel="Leave used"
          />
          <p class="mt-2 text-xs text-muted">
            {{ b.used }} used
            @if (b.pending) {
              · {{ b.pending }} pending
            }
          </p>
        } @else {
          <p class="mt-2 text-2xl font-semibold tabular-nums">{{ b.used }}</p>
          <p class="mt-2 text-xs text-muted">days taken (unpaid, no quota)</p>
        }
      </div>
    }
  `,
})
export class LeaveBalanceCards {
  readonly balances = input.required<LeaveBalance[]>();
  protected usedPct(b: LeaveBalance): number {
    return b.quota ? Math.round(((b.used + b.pending) / b.quota) * 100) : 0;
  }
}
