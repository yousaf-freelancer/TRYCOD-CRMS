import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, startWith } from 'rxjs';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { AuthService } from '../../../core/auth/auth.service';
import { LeaveBalance } from '../../../models';
import {
  addDays,
  isSunday,
  parseIsoDate,
  toIsoDate,
  todayIso,
} from '../../../shared/utils/date.util';
import { ToastService } from '../../../shared/ui/toast.service';
import { LeaveService } from '../data-access/leave.service';

@Component({
  selector: 'app-apply-leave-dialog',
  imports: [
    DialogModule,
    ReactiveFormsModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    CheckboxModule,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      header="Apply for leave"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '34rem' }"
      [breakpoints]="{ '640px': '96vw' }"
    >
      <form id="apply-leave" class="form-grid" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="field sm:col-span-2">
          <label class="field-label" for="al-type">Leave type</label>
          <p-select
            inputId="al-type"
            formControlName="leaveTypeId"
            [options]="typeOptions()"
            optionLabel="label"
            optionValue="value"
            placeholder="Select leave type"
            appendTo="body"
            [invalid]="bad('leaveTypeId')"
          />
        </div>
        <div class="field">
          <label class="field-label" for="al-from">From</label>
          <p-datepicker
            inputId="al-from"
            formControlName="from"
            dateFormat="dd M yy"
            [minDate]="minDate"
            [disabledDays]="[0]"
            [showIcon]="true"
            iconDisplay="input"
            appendTo="body"
          />
        </div>
        <div class="field">
          <label class="field-label" for="al-to">To</label>
          <p-datepicker
            inputId="al-to"
            formControlName="to"
            dateFormat="dd M yy"
            [minDate]="value().from"
            [disabledDays]="[0]"
            [showIcon]="true"
            iconDisplay="input"
            appendTo="body"
          />
        </div>
        <label class="flex items-center gap-2.5 text-[13px] sm:col-span-2">
          <p-checkbox formControlName="halfDay" [binary]="true" inputId="al-half" />
          Half day (single date only)
        </label>
        <div class="field sm:col-span-2">
          <label class="field-label" for="al-reason">Reason</label>
          <textarea
            pTextarea
            id="al-reason"
            formControlName="reason"
            rows="3"
            [invalid]="bad('reason')"
          ></textarea>
        </div>
      </form>
      <p class="mt-4 rounded-lg bg-surface-muted px-3 py-2 text-[13px]">
        <span class="font-semibold">{{ days() }}</span> working day{{
          days() === 1 ? '' : 's'
        }}
        requested
        @if (selectedBalance(); as b) {
          @if (b.quota) {
            · <span [class.text-red-700]="days() > b.available">{{ b.available }} available</span>
          }
        }
      </p>
      <ng-template #footer>
        <button type="button" class="btn btn-secondary" (click)="visible.set(false)">Cancel</button>
        <button type="submit" form="apply-leave" class="btn btn-primary" [disabled]="saving()">
          Submit request
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class ApplyLeaveDialog {
  private readonly service = inject(LeaveService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly visible = model(false);
  readonly balances = input<LeaveBalance[]>([]);
  readonly applied = output<void>();

  protected readonly minDate = parseIsoDate(todayIso());
  protected readonly saving = signal(false);
  protected readonly form = new FormGroup({
    leaveTypeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    from: new FormControl<Date>(parseIsoDate(addDays(todayIso(), 1)), { nonNullable: true }),
    to: new FormControl<Date>(parseIsoDate(addDays(todayIso(), 1)), { nonNullable: true }),
    halfDay: new FormControl(false, { nonNullable: true }),
    reason: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4)],
    }),
  });
  protected readonly value = toSignal(
    this.form.valueChanges.pipe(
      startWith(null),
      map(() => this.form.getRawValue()),
    ),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly typeOptions = computed(() =>
    this.balances().map((b) => ({
      label: b.quota ? `${b.leaveTypeName} · ${b.available} left` : b.leaveTypeName,
      value: b.leaveTypeId,
    })),
  );
  protected readonly selectedBalance = computed(
    () => this.balances().find((b) => b.leaveTypeId === this.value().leaveTypeId) ?? null,
  );
  protected readonly days = computed(() => {
    const v = this.value();
    if (v.halfDay) return 0.5;
    let n = 0;
    for (let d = toIsoDate(v.from); d <= toIsoDate(v.to); d = addDays(d, 1)) if (!isSunday(d)) n++;
    return n;
  });

  constructor() {
    effect(() => {
      if (this.visible()) this.form.reset();
    });
    this.form.controls.from.valueChanges.subscribe((from) => {
      if (this.form.controls.to.value < from) this.form.controls.to.setValue(from);
    });
  }

  protected bad(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && c.touched;
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service
      .apply({
        employeeId: this.auth.user()?.employeeId ?? '',
        leaveTypeId: v.leaveTypeId,
        from: toIsoDate(v.from),
        to: toIsoDate(v.halfDay ? v.from : v.to),
        halfDay: v.halfDay,
        reason: v.reason.trim(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.visible.set(false);
          this.toast.success('Leave request submitted', 'HR will review it shortly.');
          this.applied.emit();
        },
        error: (e: Error) => {
          this.saving.set(false);
          this.toast.error('Cannot apply', e.message);
        },
      });
  }
}
