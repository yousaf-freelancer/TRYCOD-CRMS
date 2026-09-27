import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Employee, EmployeeStatus, Gender, StaffRole } from '../../../models';
import { parseIsoDate, toIsoDate } from '../../../shared/utils/date.util';
import { ToastService } from '../../../shared/ui/toast.service';
import { EmployeesService, grossOf } from '../data-access/employees.service';

const PHONE = /^\+?[0-9\s-]{10,15}$/;

@Component({
  selector: 'app-employee-form-dialog',
  imports: [
    DialogModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [header]="employee() ? 'Edit employee' : 'Add employee'"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '46rem' }"
      [breakpoints]="{ '768px': '96vw' }"
      [contentStyle]="{ 'max-height': '72vh' }"
    >
      <form id="emp-form" class="form-grid" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="field">
          <label class="field-label" for="e-name">Full name</label>
          <input pInputText id="e-name" formControlName="name" [invalid]="bad('name')" />
        </div>
        <div class="field">
          <label class="field-label" for="e-gender">Gender</label>
          <p-select
            inputId="e-gender"
            formControlName="gender"
            [options]="genders"
            appendTo="body"
          />
        </div>
        <div class="field">
          <label class="field-label" for="e-phone">Phone</label>
          <input pInputText id="e-phone" formControlName="phone" [invalid]="bad('phone')" />
        </div>
        <div class="field">
          <label class="field-label" for="e-email">Work email</label>
          <input
            pInputText
            id="e-email"
            type="email"
            formControlName="email"
            [invalid]="bad('email')"
          />
        </div>
        <div class="field">
          <label class="field-label" for="e-role">System role</label>
          <p-select inputId="e-role" formControlName="role" [options]="roles" appendTo="body" />
          <p class="field-hint">Controls what they can access in this app.</p>
        </div>
        <div class="field">
          <label class="field-label" for="e-dept">Department</label>
          <p-select
            inputId="e-dept"
            formControlName="department"
            [options]="departments.value()"
            appendTo="body"
            [invalid]="bad('department')"
          />
        </div>
        <div class="field">
          <label class="field-label" for="e-desig">Designation</label>
          <input
            pInputText
            id="e-desig"
            formControlName="designation"
            [invalid]="bad('designation')"
          />
        </div>
        <div class="field">
          <label class="field-label" for="e-join">Joining date</label>
          <p-datepicker
            inputId="e-join"
            formControlName="joiningDate"
            dateFormat="dd M yy"
            [showIcon]="true"
            iconDisplay="input"
            appendTo="body"
          />
        </div>
        <div class="field">
          <label class="field-label" for="e-dob">Date of birth</label>
          <input pInputText type="date" id="e-dob" formControlName="dob" />
        </div>
        <div class="field">
          <label class="field-label" for="e-gross">Monthly gross (₹)</label>
          <p-inputnumber
            inputId="e-gross"
            formControlName="gross"
            mode="decimal"
            locale="en-IN"
            [min]="0"
            [invalid]="bad('gross')"
          />
        </div>
        <div class="field sm:col-span-2">
          <label class="field-label" for="e-address">Address</label>
          <input pInputText id="e-address" formControlName="address" />
        </div>
        <div class="field">
          <label class="field-label" for="e-bank">Bank account (masked)</label>
          <input
            pInputText
            id="e-bank"
            formControlName="bankAccount"
            placeholder="XXXX XXXX 1234"
          />
        </div>
        <div class="field">
          <label class="field-label" for="e-status">Status</label>
          <p-select
            inputId="e-status"
            formControlName="status"
            [options]="statuses"
            appendTo="body"
          />
        </div>
      </form>
      <ng-template #footer>
        <button type="button" class="btn btn-secondary" (click)="visible.set(false)">Cancel</button>
        <button type="submit" form="emp-form" class="btn btn-primary" [disabled]="saving()">
          {{ employee() ? 'Save changes' : 'Add employee' }}
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class EmployeeFormDialog {
  private readonly service = inject(EmployeesService);
  private readonly toast = inject(ToastService);

  readonly visible = model(false);
  readonly employee = input<Employee | null>(null);
  readonly saved = output<void>();

  protected readonly genders: Gender[] = ['Male', 'Female'];
  protected readonly roles: StaffRole[] = ['Admin', 'Advisor', 'Mentor', 'Sales'];
  protected readonly statuses: EmployeeStatus[] = ['Active', 'Inactive'];
  protected readonly saving = signal(false);
  protected readonly departments = rxResource({
    stream: () => this.service.getDepartments().pipe(map((d) => d.map((x) => x.name))),
    defaultValue: [],
  });

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    gender: new FormControl<Gender>('Male', { nonNullable: true }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PHONE)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    role: new FormControl<StaffRole>('Mentor', { nonNullable: true }),
    department: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    designation: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    joiningDate: new FormControl<Date>(new Date(), { nonNullable: true }),
    dob: new FormControl('1995-01-01', { nonNullable: true }),
    gross: new FormControl(30000, { nonNullable: true, validators: [Validators.min(1)] }),
    address: new FormControl('', { nonNullable: true }),
    bankAccount: new FormControl('', { nonNullable: true }),
    status: new FormControl<EmployeeStatus>('Active', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      const e = this.employee();
      if (!e) {
        this.form.reset();
        return;
      }
      this.form.reset({
        ...e,
        joiningDate: parseIsoDate(e.joiningDate),
        gross: 0,
      });
      this.service
        .getSalaryStructure(e.id)
        .subscribe((s) => s && this.form.controls.gross.setValue(grossOf(s)));
    });
  }

  protected bad(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && c.touched;
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { gross, joiningDate, ...v } = this.form.getRawValue();
    const e = this.employee();
    const input = {
      ...v,
      joiningDate: toIsoDate(joiningDate),
      pan: e?.pan ?? 'XXXXX0000X',
      reportingTo: e?.reportingTo ?? 'EMP-001',
    };
    this.saving.set(true);
    (e
      ? this.service.updateEmployee(e.id, input, gross)
      : this.service.createEmployee(input, gross)
    ).subscribe(() => {
      this.saving.set(false);
      this.visible.set(false);
      this.toast.success(e ? 'Employee updated' : 'Employee added', v.name);
      this.saved.emit();
    });
  }
}
