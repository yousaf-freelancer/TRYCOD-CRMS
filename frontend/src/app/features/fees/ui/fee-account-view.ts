import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { FeeAccount } from '../../../models';
import { AppDatePipe, InrPipe } from '../../../shared/pipes/format.pipes';
import { Meter } from '../../../shared/ui/meter';
import { StatusBadge } from '../../../shared/ui/status-badge';

/** Fee plan, installments, payments and balance for one student (staff + portal). */
@Component({
  selector: 'app-fee-account-view',
  imports: [RouterLink, LucideDynamicIcon, StatusBadge, Meter, InrPipe, AppDatePipe],
  host: { class: 'block space-y-4' },
  template: `
    @let a = account();
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="card card-pad">
        <p class="text-xs text-muted">Net fee</p>
        <p class="mt-1 text-xl font-semibold tabular-nums">{{ a.netFee | inr }}</p>
        <p class="mt-1 text-xs text-muted">
          {{ a.totalFee | inr }}
          @if (a.discount) {
            − {{ a.discount | inr }} discount
          }
        </p>
      </div>
      <div class="card card-pad">
        <p class="text-xs text-muted">Paid</p>
        <p class="mt-1 text-xl font-semibold tabular-nums">{{ a.paid | inr }}</p>
        <app-meter class="mt-2" [value]="paidPct()" [thresholds]="false" ariaLabel="Fee paid" />
      </div>
      <div class="card card-pad">
        <p class="text-xs text-muted">Balance</p>
        <p
          class="mt-1 text-xl font-semibold tabular-nums"
          [class.text-red-700]="a.status === 'Overdue'"
        >
          {{ a.balance | inr }}
        </p>
        <div class="mt-1.5"><app-status-badge [status]="a.status" /></div>
      </div>
      <div class="card card-pad">
        <p class="text-xs text-muted">Next due</p>
        @if (a.nextDue; as next) {
          <p class="mt-1 text-xl font-semibold tabular-nums">{{ next.balance | inr }}</p>
          <p
            class="mt-1 text-xs"
            [class.text-red-700]="next.status === 'Overdue'"
            [class.text-muted]="next.status !== 'Overdue'"
          >
            {{ next.status === 'Overdue' ? 'Overdue since' : 'Due on' }}
            {{ next.dueDate | appDate }}
          </p>
        } @else {
          <p class="mt-1 text-xl font-semibold">—</p>
          <p class="mt-1 text-xs text-muted">Fully paid</p>
        }
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="card-header">
        <div>
          <h3 class="card-title">Installments</h3>
          <p class="card-subtitle">
            {{
              a.planType === 'Full' ? 'One-time payment' : a.installments.length + ' installments'
            }}
          </p>
        </div>
        @if (showCollect() && a.balance > 0) {
          <a
            [routerLink]="['/fees/collect']"
            [queryParams]="{ student: a.studentId }"
            class="btn btn-primary btn-sm"
          >
            <svg lucideIcon="indian-rupee" size="14" /> Collect fee
          </a>
        }
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[560px] text-[13px]">
          <thead class="bg-neutral-50 text-left text-xs text-muted">
            <tr>
              <th class="px-5 py-2 font-medium">#</th>
              <th class="px-3 py-2 font-medium">Due date</th>
              <th class="px-3 py-2 text-right font-medium">Amount</th>
              <th class="px-3 py-2 text-right font-medium">Paid</th>
              <th class="px-3 py-2 text-right font-medium">Balance</th>
              <th class="px-5 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            @for (i of a.installments; track i.id) {
              <tr>
                <td class="px-5 py-2.5 font-medium">{{ i.number }}</td>
                <td class="px-3 py-2.5">
                  {{ i.dueDate | appDate }}
                  @if (i.daysOverdue) {
                    <span class="ml-1 text-xs text-red-700">({{ i.daysOverdue }}d overdue)</span>
                  }
                </td>
                <td class="px-3 py-2.5 text-right tabular-nums">{{ i.amount | inr }}</td>
                <td class="px-3 py-2.5 text-right tabular-nums">{{ i.paidAmount | inr }}</td>
                <td class="px-3 py-2.5 text-right font-medium tabular-nums">
                  {{ i.balance | inr }}
                </td>
                <td class="px-5 py-2.5"><app-status-badge [status]="i.status" /></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="card-header">
        <div>
          <h3 class="card-title">Payments & receipts</h3>
          <p class="card-subtitle">
            {{ a.payments.length }} payment{{ a.payments.length === 1 ? '' : 's' }}
          </p>
        </div>
      </div>
      @if (a.payments.length) {
        <div class="overflow-x-auto">
          <table class="w-full min-w-[620px] text-[13px]">
            <thead class="bg-neutral-50 text-left text-xs text-muted">
              <tr>
                <th class="px-5 py-2 font-medium">Receipt</th>
                <th class="px-3 py-2 font-medium">Date</th>
                <th class="px-3 py-2 font-medium">Mode</th>
                <th class="px-3 py-2 font-medium">Reference</th>
                <th class="px-3 py-2 text-right font-medium">Amount</th>
                <th class="px-5 py-2"><span class="sr-only">Receipt</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
              @for (p of a.payments; track p.id) {
                <tr>
                  <td class="mono px-5 py-2.5">{{ p.receiptNo }}</td>
                  <td class="px-3 py-2.5">{{ p.date | appDate }}</td>
                  <td class="px-3 py-2.5">{{ p.mode }}</td>
                  <td class="mono px-3 py-2.5 text-muted">{{ p.reference || '—' }}</td>
                  <td class="px-3 py-2.5 text-right font-medium tabular-nums">
                    {{ p.amount | inr }}
                  </td>
                  <td class="px-5 py-2.5 text-right">
                    <a [routerLink]="[receiptBase(), p.id]" class="btn btn-ghost btn-sm"
                      ><svg lucideIcon="receipt" size="14" /> Receipt</a
                    >
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="px-5 py-8 text-center text-[13px] text-muted">No payments recorded yet.</p>
      }
    </div>
  `,
})
export class FeeAccountView {
  readonly account = input.required<FeeAccount>();
  readonly showCollect = input(true);
  /** `/fees/receipt` for staff, `/portal/receipt` for students. */
  readonly receiptBase = input('/fees/receipt');

  protected readonly paidPct = computed(() => {
    const a = this.account();
    return a.netFee ? Math.round((a.paid / a.netFee) * 100) : 0;
  });
}
