import { Component, computed, input } from '@angular/core';
import { InstituteProfile, Payslip } from '../../../models';
import { AppDatePipe, InrPipe } from '../../../shared/pipes/format.pipes';
import { amountInWords } from '../../../shared/utils/format.util';
import { Logo } from '../../../shared/ui/logo';

/** Printable monthly payslip. */
@Component({
  selector: 'app-payslip-view',
  imports: [Logo, InrPipe, AppDatePipe],
  host: { class: 'block' },
  template: `
    @let p = payslip();
    <article
      class="print-area mx-auto max-w-[800px] rounded-card border border-line bg-white p-8 shadow-card sm:p-10"
      aria-label="Payslip"
    >
      <header
        class="flex flex-col gap-4 border-b border-neutral-900 pb-6 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <app-logo [height]="32" />
          <p class="mt-3 text-[13px] leading-5 text-ink-secondary">
            {{ institute().address }}, {{ institute().city }}, {{ institute().state }}
            {{ institute().pincode }}
          </p>
        </div>
        <div class="sm:text-right">
          <p class="text-xs font-semibold tracking-[0.2em] text-muted uppercase">Payslip</p>
          <p class="mt-1 text-lg font-semibold">{{ p.month | appDate: 'monthLong' }}</p>
          @if (p.status === 'Draft') {
            <p
              class="mt-1 inline-block rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
            >
              Draft — not yet processed
            </p>
          }
        </div>
      </header>

      <section class="grid gap-x-8 gap-y-2 py-6 text-[13px] sm:grid-cols-2">
        <div class="flex justify-between gap-4">
          <span class="text-muted">Employee</span
          ><span class="font-semibold">{{ p.employeeName }}</span>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-muted">Employee ID</span><span class="mono">{{ p.employeeId }}</span>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-muted">Designation</span><span>{{ p.designation }}</span>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-muted">Department</span><span>{{ p.department }}</span>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-muted">Date of joining</span><span>{{ p.joiningDate | appDate }}</span>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-muted">Bank account</span><span class="mono">{{ p.bankAccount }}</span>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-muted">PAN</span><span class="mono">{{ p.pan }}</span>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-muted">Paid days</span
          ><span
            >{{ p.paidDays }} / {{ p.workingDays }}
            @if (p.lopDays) {
              ({{ p.lopDays }} LOP)
            }
          </span>
        </div>
      </section>

      <div class="grid border border-neutral-900 text-[13px] sm:grid-cols-2">
        <table class="w-full sm:border-r sm:border-neutral-900">
          <thead>
            <tr class="bg-neutral-950 text-left text-xs tracking-wide text-white uppercase">
              <th class="px-4 py-2 font-medium">Earnings</th>
              <th class="px-4 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            @for (e of p.earnings; track e.label) {
              <tr class="border-t border-neutral-200">
                <td class="px-4 py-2">{{ e.label }}</td>
                <td class="px-4 py-2 text-right tabular-nums">{{ e.amount | inr }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr class="border-t border-neutral-900 font-semibold">
              <td class="px-4 py-2">Gross earnings</td>
              <td class="px-4 py-2 text-right tabular-nums">{{ p.grossEarnings | inr }}</td>
            </tr>
          </tfoot>
        </table>
        <table class="w-full border-t border-neutral-900 sm:border-t-0">
          <thead>
            <tr class="bg-neutral-950 text-left text-xs tracking-wide text-white uppercase">
              <th class="px-4 py-2 font-medium">Deductions</th>
              <th class="px-4 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            @for (d of p.deductions; track d.label) {
              <tr class="border-t border-neutral-200">
                <td class="px-4 py-2">{{ d.label }}</td>
                <td class="px-4 py-2 text-right tabular-nums">{{ d.amount | inr }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr class="border-t border-neutral-900 font-semibold">
              <td class="px-4 py-2">Total deductions</td>
              <td class="px-4 py-2 text-right tabular-nums">{{ p.totalDeductions | inr }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div
        class="mt-6 flex flex-col gap-2 rounded-xl bg-neutral-950 px-6 py-5 text-white sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p class="text-xs tracking-wide text-white/60 uppercase">Net pay</p>
          <p class="text-[13px] text-white/80">{{ words() }}</p>
        </div>
        <p class="text-2xl font-semibold tabular-nums">{{ p.netPay | inr }}</p>
      </div>

      <p class="mt-6 text-center text-xs text-muted">
        This is a system-generated payslip and does not require a signature.
      </p>
    </article>
  `,
})
export class PayslipView {
  readonly payslip = input.required<Payslip>();
  readonly institute = input.required<InstituteProfile>();
  protected readonly words = computed(() => amountInWords(this.payslip().netPay));
}
