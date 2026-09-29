import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { map, startWith } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../../../core/auth/auth.service';
import { PAYMENT_MODES, PaymentMode } from '../../../../domain/models';
import { AppDatePipe, InrPipe } from '../../../../shared/pipes/format.pipes';
import { parseIsoDate, toIsoDate, todayIso } from '../../../../shared/utils/date.util';
import { amountInWords } from '../../../../shared/utils/format.util';
import { Avatar } from '../../../../shared/ui/avatar';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { StatusBadge } from '../../../../shared/ui/status-badge';
import { ToastService } from '../../../../shared/ui/toast.service';
import { StudentsService } from '../../../../data/services/students.service';
import { FeesService } from '../../../../data/services/fees.service';

@Component({
  selector: 'app-collect-fee',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideDynamicIcon,
    SelectModule,
    SelectButtonModule,
    InputNumberModule,
    InputTextModule,
    DatePickerModule,
    SkeletonModule,
    Avatar,
    StatusBadge,
    EmptyState,
    InrPipe,
    AppDatePipe,
  ],
  template: `
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section class="space-y-4">
        <div class="card card-pad">
          <label class="field-label mb-1.5 block" for="collect-student">Student</label>
          <p-select
            inputId="collect-student"
            [options]="studentOptions()"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="studentId"
            [filter]="true"
            filterBy="label"
            placeholder="Search by name, ID or batch"
            [loading]="students.isLoading()"
            [showClear]="true"
            [virtualScroll]="true"
            [virtualScrollItemSize]="40"
            appendTo="body"
          >
            <ng-template #item let-o>
              <div class="flex w-full items-center justify-between gap-3">
                <span class="truncate">{{ o.label }}</span>
                <span class="shrink-0 text-xs tabular-nums" [class.text-red-700]="o.overdue">{{
                  o.balance | inr
                }}</span>
              </div>
            </ng-template>
          </p-select>
          <p class="field-hint mt-1.5">Only students with an outstanding balance are listed.</p>
        </div>

        @if (!studentId()) {
          <div class="card">
            <app-empty-state
              icon="search"
              title="Select a student"
              message="Their balance and installments will appear here."
            />
          </div>
        } @else if (account.isLoading()) {
          <div class="card card-pad space-y-3">
            <p-skeleton height="3rem" /><p-skeleton height="10rem" />
          </div>
        } @else if (account.value(); as a) {
          <div class="card card-pad">
            <div class="flex items-center gap-3">
              <app-avatar [name]="a.studentName" size="md" />
              <div class="min-w-0 flex-1">
                <p class="font-semibold">{{ a.studentName }}</p>
                <p class="text-xs text-muted">
                  {{ a.studentId }} · {{ a.courseName }} · {{ a.batchCode }} · {{ a.phone }}
                </p>
              </div>
              <app-status-badge [status]="a.status" />
            </div>
            <dl class="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-surface-muted p-4 text-center">
              <div>
                <dt class="text-xs text-muted">Net fee</dt>
                <dd class="font-semibold tabular-nums">{{ a.netFee | inr }}</dd>
              </div>
              <div>
                <dt class="text-xs text-muted">Paid</dt>
                <dd class="font-semibold tabular-nums">{{ a.paid | inr }}</dd>
              </div>
              <div>
                <dt class="text-xs text-muted">Balance</dt>
                <dd
                  class="font-semibold tabular-nums"
                  [class.text-red-700]="a.status === 'Overdue'"
                >
                  {{ a.balance | inr }}
                </dd>
              </div>
            </dl>
          </div>
          <div class="card overflow-hidden">
            <div class="card-header"><h3 class="card-title">Installments</h3></div>
            <ul class="divide-y divide-neutral-100">
              @for (i of a.installments; track i.id) {
                <li class="flex items-center gap-4 px-5 py-3 text-[13px]">
                  <span
                    class="grid size-7 place-items-center rounded-full border border-line text-xs font-semibold"
                    >{{ i.number }}</span
                  >
                  <div class="min-w-0 flex-1">
                    <p class="font-medium tabular-nums">{{ i.amount | inr }}</p>
                    <p class="text-xs text-muted">
                      Due {{ i.dueDate | appDate }}
                      @if (i.paidAmount && i.balance) {
                        · {{ i.paidAmount | inr }} paid
                      }
                    </p>
                  </div>
                  <app-status-badge [status]="i.status" />
                  @if (i.balance) {
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      (click)="form.controls.amount.setValue(i.balance)"
                    >
                      Pay {{ i.balance | inr }}
                    </button>
                  }
                </li>
              }
            </ul>
          </div>
        }
      </section>

      <aside>
        <form
          class="card card-pad sticky top-[calc(var(--tc-header-height)+1.5rem)] space-y-4"
          [formGroup]="form"
          (ngSubmit)="submit()"
          novalidate
          aria-label="Payment details"
        >
          <h2 class="section-title">Payment details</h2>
          <div class="field">
            <label class="field-label" for="pay-amount">Amount (₹)</label>
            <p-inputnumber
              inputId="pay-amount"
              formControlName="amount"
              mode="decimal"
              locale="en-IN"
              [min]="1"
              [max]="balance() || null"
              [invalid]="bad('amount')"
            />
            @if (formValue().amount) {
              <p class="field-hint">{{ words() }}</p>
            }
            @if (bad('amount')) {
              <p class="field-error">Enter an amount up to the balance.</p>
            }
          </div>
          <div class="field">
            <span class="field-label" id="pay-mode-label">Mode</span>
            <p-selectbutton
              formControlName="mode"
              [options]="modes"
              [allowEmpty]="false"
              ariaLabelledBy="pay-mode-label"
              class="flex-wrap"
            />
          </div>
          <div class="field">
            <label class="field-label" for="pay-ref"
              >Reference {{ formValue().mode === 'Cash' ? '(optional)' : '' }}</label
            >
            <input
              pInputText
              id="pay-ref"
              formControlName="reference"
              [placeholder]="refPlaceholder()"
              [invalid]="bad('reference')"
            />
            @if (bad('reference')) {
              <p class="field-error">Reference is required for {{ formValue().mode }} payments.</p>
            }
          </div>
          <div class="field">
            <label class="field-label" for="pay-date">Payment date</label>
            <p-datepicker
              inputId="pay-date"
              formControlName="date"
              dateFormat="dd M yy"
              [maxDate]="today"
              [showIcon]="true"
              iconDisplay="input"
              appendTo="body"
            />
          </div>
          <div class="field">
            <label class="field-label" for="pay-note">Note</label>
            <input
              pInputText
              id="pay-note"
              formControlName="note"
              placeholder="e.g. Installment 3"
            />
          </div>
          <button
            type="submit"
            class="btn btn-primary btn-lg w-full"
            [disabled]="!studentId() || saving()"
          >
            @if (saving()) {
              <svg lucideIcon="loader-circle" size="16" class="animate-spin" /> Recording payment…
            } @else {
              <svg lucideIcon="check" size="16" /> Record payment & print receipt
            }
          </button>
          <p class="text-center text-xs text-muted">A receipt number is generated automatically.</p>
        </form>
      </aside>
    </div>
  `,
})
export class CollectFee {
  private readonly fees = inject(FeesService);
  private readonly studentsService = inject(StudentsService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** `?student=` query param. */
  readonly student = input<string>();

  protected readonly modes = [...PAYMENT_MODES];
  protected readonly today = parseIsoDate(todayIso());
  protected readonly studentId = signal<string | null>(null);
  protected readonly saving = signal(false);

  protected readonly students = rxResource({
    stream: () => this.studentsService.getStudents({ status: 'Active' }),
    defaultValue: [],
  });
  protected readonly studentOptions = computed(() =>
    this.students
      .value()
      .filter((s) => s.balance > 0 || s.id === this.studentId())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => ({
        label: `${s.name} · ${s.id} · ${s.batchCode}`,
        value: s.id,
        balance: s.balance,
        overdue: s.feeStatus === 'Overdue',
      })),
  );

  protected readonly account = rxResource({
    params: () => this.studentId() ?? undefined,
    stream: ({ params }) => this.fees.getFeeAccount(params),
  });
  protected readonly balance = computed(() =>
    this.account.hasValue() ? (this.account.value()?.balance ?? 0) : 0,
  );

  protected readonly form = new FormGroup({
    amount: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    mode: new FormControl<PaymentMode>('UPI', { nonNullable: true }),
    reference: new FormControl('', { nonNullable: true }),
    date: new FormControl<Date>(parseIsoDate(todayIso()), { nonNullable: true }),
    note: new FormControl('', { nonNullable: true }),
  });
  protected readonly formValue = toSignal(
    this.form.valueChanges.pipe(
      startWith(null),
      map(() => this.form.getRawValue()),
    ),
    {
      initialValue: this.form.getRawValue(),
    },
  );
  protected readonly words = computed(() => amountInWords(this.formValue().amount ?? 0));
  protected readonly refPlaceholder = computed(
    () =>
      ({
        UPI: 'UPI transaction ID',
        Card: 'Last 4 digits / approval code',
        'Bank Transfer': 'NEFT / IMPS reference',
        Cash: 'Optional',
      })[this.formValue().mode],
  );

  constructor() {
    effect(() => {
      const fromQuery = this.student();
      if (fromQuery) this.studentId.set(fromQuery);
    });
    // Pre-fill the amount with the next due balance whenever the account loads.
    effect(() => {
      const a = this.account.hasValue() ? this.account.value() : null;
      if (a?.nextDue) {
        this.form.patchValue({
          amount: a.nextDue.balance,
          note: `Installment ${a.nextDue.number}`,
        });
      }
    });
    this.form.controls.mode.valueChanges.subscribe((mode) => {
      this.form.controls.reference.setValidators(mode === 'Cash' ? [] : [Validators.required]);
      this.form.controls.reference.updateValueAndValidity();
    });
    this.form.controls.reference.setValidators([Validators.required]);
  }

  protected bad(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && c.touched;
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    const id = this.studentId();
    const v = this.form.getRawValue();
    if (!id || this.form.invalid || !v.amount) return;
    if (v.amount > this.balance()) {
      this.form.controls.amount.setErrors({ max: true });
      return;
    }
    this.saving.set(true);
    this.fees
      .createPayment({
        studentId: id,
        amount: v.amount,
        mode: v.mode,
        reference: v.reference.trim(),
        date: toIsoDate(v.date),
        collectedBy: this.auth.user()?.employeeId ?? '',
        note: v.note,
      })
      .subscribe({
        next: (receipt) => {
          this.saving.set(false);
          this.toast.success(
            'Payment recorded',
            `${receipt.payment.receiptNo} · ₹${receipt.payment.amount.toLocaleString('en-IN')}`,
          );
          void this.router.navigate(['/fees/receipt', receipt.payment.id]);
        },
        error: (e: Error) => {
          this.saving.set(false);
          this.toast.error('Payment not recorded', e.message);
        },
      });
  }
}
