import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { StaffAttendanceStatus, StaffAttendanceView } from '../../../../domain/models';
import { formatDate } from '../../../../shared/utils/date.util';
import { ToastService } from '../../../../shared/ui/toast.service';
import { AttendanceService } from '../../../../data/services/attendance.service';

/** Manual correction of a staff attendance record. */
@Component({
  selector: 'app-staff-correction-dialog',
  imports: [DialogModule, ReactiveFormsModule, SelectModule, InputTextModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      header="Edit attendance"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '28rem' }"
      [breakpoints]="{ '640px': '96vw' }"
    >
      @if (record(); as r) {
        <p class="mb-4 text-[13px] text-muted">
          <span class="font-medium text-ink">{{ r.employeeName }}</span> · {{ date(r.date) }}
        </p>
      }
      <form id="staff-fix" class="form-grid" [formGroup]="form" (ngSubmit)="save()">
        <div class="field sm:col-span-2">
          <label class="field-label" for="sf-status">Status</label>
          <p-select
            inputId="sf-status"
            formControlName="status"
            [options]="statuses"
            appendTo="body"
          />
        </div>
        <div class="field">
          <label class="field-label" for="sf-in">Check-in</label>
          <input pInputText id="sf-in" type="time" formControlName="checkIn" />
        </div>
        <div class="field">
          <label class="field-label" for="sf-out">Check-out</label>
          <input pInputText id="sf-out" type="time" formControlName="checkOut" />
        </div>
      </form>
      <p class="mt-4 text-xs text-muted">Corrections are saved with source “Manual” for audit.</p>
      <ng-template #footer>
        <button type="button" class="btn btn-secondary" (click)="visible.set(false)">Cancel</button>
        <button type="submit" form="staff-fix" class="btn btn-primary" [disabled]="saving()">
          Save
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class StaffCorrectionDialog {
  private readonly service = inject(AttendanceService);
  private readonly toast = inject(ToastService);
  readonly visible = model(false);
  readonly record = input<StaffAttendanceView | null>(null);
  readonly saved = output<void>();

  protected readonly statuses: StaffAttendanceStatus[] = [
    'Present',
    'Late',
    'Half Day',
    'Absent',
    'On Leave',
  ];
  protected readonly saving = signal(false);
  protected readonly date = formatDate;
  protected readonly form = new FormGroup({
    status: new FormControl<StaffAttendanceStatus>('Present', { nonNullable: true }),
    checkIn: new FormControl('', { nonNullable: true }),
    checkOut: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const r = this.record();
      if (this.visible() && r)
        this.form.reset({ status: r.status, checkIn: r.checkIn ?? '', checkOut: r.checkOut ?? '' });
    });
  }

  protected save(): void {
    const r = this.record();
    if (!r) return;
    const v = this.form.getRawValue();
    const noTimes = v.status === 'Absent' || v.status === 'On Leave';
    this.saving.set(true);
    this.service
      .correctStaffAttendance({
        employeeId: r.employeeId,
        date: r.date,
        status: v.status,
        checkIn: noTimes ? null : v.checkIn || null,
        checkOut: noTimes ? null : v.checkOut || null,
      })
      .subscribe(() => {
        this.saving.set(false);
        this.visible.set(false);
        this.toast.success('Attendance updated', r.employeeName);
        this.saved.emit();
      });
  }
}
