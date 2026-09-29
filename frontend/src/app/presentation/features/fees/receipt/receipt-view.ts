import { Component, computed, input } from '@angular/core';
import { InstituteProfile, Receipt } from '../../../../domain/models';
import { AppDatePipe, InrPipe } from '../../../../shared/pipes/format.pipes';
import { amountInWords } from '../../../../shared/utils/format.util';
import { Logo } from '../../../../shared/ui/logo';

/** Clean black & white fee receipt, designed for A4/A5 printing. */
@Component({
  selector: 'app-receipt-view',
  imports: [Logo, InrPipe, AppDatePipe],
  host: { class: 'block' },
  template: `
    @let r = receipt();
    @let p = r.payment;
    <article
      class="print-area mx-auto max-w-[760px] rounded-card border border-line bg-white p-8 text-ink shadow-card sm:p-10"
      aria-label="Fee receipt"
    >
      <header
        class="flex flex-col gap-6 border-b border-neutral-900 pb-6 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <app-logo [height]="34" />
          <p class="mt-3 text-[13px] leading-5 text-ink-secondary">
            {{ institute().address }}, {{ institute().city }}<br />
            {{ institute().state }} {{ institute().pincode }} · {{ institute().phone }}<br />
            {{ institute().email }} · GSTIN {{ institute().gstin }}
          </p>
        </div>
        <div class="sm:text-right">
          <p class="text-xs font-semibold tracking-[0.2em] text-muted uppercase">Fee receipt</p>
          <p class="mono mt-1 text-lg font-semibold">{{ p.receiptNo }}</p>
          <p class="mt-1 text-[13px] text-ink-secondary">Date: {{ p.date | appDate }}</p>
        </div>
      </header>

      <section class="grid gap-6 py-6 sm:grid-cols-2">
        <div>
          <p class="text-xs font-medium tracking-wide text-muted uppercase">Received from</p>
          <p class="mt-1 text-base font-semibold">{{ p.studentName }}</p>
          <p class="text-[13px] text-ink-secondary">Student ID: {{ p.studentId }}</p>
          <p class="text-[13px] text-ink-secondary">{{ r.studentPhone }} · {{ r.studentEmail }}</p>
        </div>
        <div>
          <p class="text-xs font-medium tracking-wide text-muted uppercase">Course</p>
          <p class="mt-1 text-base font-semibold">{{ p.courseName }}</p>
          <p class="text-[13px] text-ink-secondary">Batch: {{ p.batchCode }}</p>
        </div>
      </section>

      <table class="w-full border-y border-neutral-900 text-[13.5px]">
        <thead>
          <tr class="text-left text-xs tracking-wide text-muted uppercase">
            <th class="py-2.5 font-medium">Description</th>
            <th class="py-2.5 font-medium">Mode</th>
            <th class="py-2.5 font-medium">Reference</th>
            <th class="py-2.5 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-t border-neutral-200">
            <td class="py-3">{{ p.note || 'Course fee' }}</td>
            <td class="py-3">{{ p.mode }}</td>
            <td class="mono py-3">{{ p.reference || '—' }}</td>
            <td class="py-3 text-right font-semibold tabular-nums">{{ p.amount | inr }}</td>
          </tr>
        </tbody>
      </table>

      <div class="flex flex-col gap-6 py-6 sm:flex-row sm:justify-between">
        <div class="max-w-sm">
          <p class="text-xs font-medium tracking-wide text-muted uppercase">Amount in words</p>
          <p class="mt-1 text-[13.5px] font-medium">{{ words() }}</p>
        </div>
        <dl class="w-full space-y-1.5 text-[13.5px] sm:w-64">
          <div class="flex justify-between">
            <dt class="text-ink-secondary">Net course fee</dt>
            <dd class="tabular-nums">{{ r.netFee | inr }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-ink-secondary">Total paid to date</dt>
            <dd class="tabular-nums">{{ r.totalPaid | inr }}</dd>
          </div>
          <div class="flex justify-between border-t border-neutral-900 pt-1.5 font-semibold">
            <dt>Balance due</dt>
            <dd class="tabular-nums">{{ r.balanceAfter | inr }}</dd>
          </div>
        </dl>
      </div>

      <footer
        class="mt-6 flex items-end justify-between gap-6 border-t border-neutral-200 pt-6 text-xs text-muted"
      >
        <p class="max-w-sm">
          This is a computer-generated receipt. Fees once paid are non-refundable and
          non-transferable. Received by {{ p.collectedByName }}.
        </p>
        <div class="text-center">
          <div class="mb-1 h-10 w-40 border-b border-neutral-400"></div>
          Authorised signatory
        </div>
      </footer>
    </article>
  `,
})
export class ReceiptView {
  readonly receipt = input.required<Receipt>();
  readonly institute = input.required<InstituteProfile>();
  protected readonly words = computed(() => amountInWords(this.receipt().payment.amount));
}
