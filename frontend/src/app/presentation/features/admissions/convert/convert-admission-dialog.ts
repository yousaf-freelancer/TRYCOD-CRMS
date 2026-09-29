import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AuthService } from '../../../../core/auth/auth.service';
import { AdmissionView, FeePlanType, Gender, GuardianRelation } from '../../../../domain/models';
import { InrPipe } from '../../../../shared/pipes/format.pipes';
import { addMonths, formatDate, toIsoDate } from '../../../../shared/utils/date.util';
import { ToastService } from '../../../../shared/ui/toast.service';
import { CoursesService } from '../../../../data/services/courses.service';
import { EmployeesService } from '../../../../data/services/employees.service';
import { AdmissionsService } from '../../../../data/services/admissions.service';
import { map } from 'rxjs';

export interface ConvertSource {
  type: 'Lead' | 'Enquiry' | 'Direct';
  id: string | null;
  name: string;
  phone: string;
  email: string;
  courseId: string;
}

const PHONE = /^\+?[0-9\s-]{10,15}$/;

/** Converts a lead / enquiry (or a walk-in) into a student admission with a fee plan. */
@Component({
  selector: 'app-convert-admission-dialog',
  imports: [
    DialogModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    DatePickerModule,
    InputNumberModule,
    LucideDynamicIcon,
    InrPipe,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      header="Convert to admission"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '52rem' }"
      [breakpoints]="{ '900px': '96vw' }"
      [contentStyle]="{ 'max-height': '72vh' }"
    >
      @if (source(); as src) {
        @if (src.id) {
          <p
            class="mb-5 flex items-center gap-2 rounded-lg border border-line bg-surface-muted px-3 py-2 text-[13px] text-ink-secondary"
          >
            <svg lucideIcon="link" size="14" /> Converting {{ src.type.toLowerCase() }}
            <span class="mono text-ink">{{ src.id }}</span>
          </p>
        }
      }
      <form id="convert-form" [formGroup]="form" (ngSubmit)="save()" novalidate class="space-y-7">
        <fieldset>
          <legend class="section-title mb-3">Student details</legend>
          <div class="form-grid">
            <div class="field">
              <label class="field-label" for="cv-name">Full name</label>
              <input pInputText id="cv-name" formControlName="name" [invalid]="invalid('name')" />
            </div>
            <div class="field">
              <label class="field-label" for="cv-gender">Gender</label>
              <p-select
                inputId="cv-gender"
                formControlName="gender"
                [options]="genders"
                appendTo="body"
              />
            </div>
            <div class="field">
              <label class="field-label" for="cv-phone">Phone</label>
              <input
                pInputText
                id="cv-phone"
                formControlName="phone"
                [invalid]="invalid('phone')"
              />
            </div>
            <div class="field">
              <label class="field-label" for="cv-email">Email</label>
              <input
                pInputText
                id="cv-email"
                type="email"
                formControlName="email"
                [invalid]="invalid('email')"
              />
            </div>
            <div class="field">
              <label class="field-label" for="cv-dob">Date of birth</label>
              <input
                pInputText
                type="date"
                id="cv-dob"
                formControlName="dob"
                [max]="todayIso"
                [invalid]="invalid('dob')"
              />
            </div>
            <div class="field">
              <label class="field-label" for="cv-qual">Qualification</label>
              <input
                pInputText
                id="cv-qual"
                formControlName="qualification"
                placeholder="e.g. B.Tech Computer Science"
              />
            </div>
            <div class="field">
              <label class="field-label" for="cv-address">Address</label>
              <input pInputText id="cv-address" formControlName="address" />
            </div>
            <div class="field">
              <label class="field-label" for="cv-city">City</label>
              <input pInputText id="cv-city" formControlName="city" placeholder="Kochi" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend class="section-title mb-3">Guardian</legend>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="field">
              <label class="field-label" for="cv-gname">Name</label>
              <input
                pInputText
                id="cv-gname"
                formControlName="guardianName"
                [invalid]="invalid('guardianName')"
              />
            </div>
            <div class="field">
              <label class="field-label" for="cv-grel">Relation</label>
              <p-select
                inputId="cv-grel"
                formControlName="guardianRelation"
                [options]="relations"
                appendTo="body"
              />
            </div>
            <div class="field">
              <label class="field-label" for="cv-gphone">Phone</label>
              <input
                pInputText
                id="cv-gphone"
                formControlName="guardianPhone"
                [invalid]="invalid('guardianPhone')"
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend class="section-title mb-3">Course & batch</legend>
          <div class="form-grid">
            <div class="field">
              <label class="field-label" for="cv-course">Course</label>
              <p-select
                inputId="cv-course"
                formControlName="courseId"
                [options]="courses.value()"
                optionLabel="name"
                optionValue="id"
                placeholder="Select course"
                appendTo="body"
                [invalid]="invalid('courseId')"
              />
            </div>
            <div class="field">
              <label class="field-label" for="cv-batch">Batch</label>
              <p-select
                inputId="cv-batch"
                formControlName="batchId"
                [options]="batchOptions()"
                optionLabel="label"
                optionValue="value"
                [placeholder]="
                  batchOptions().length ? 'Select batch' : 'No open batches for this course'
                "
                appendTo="body"
                [invalid]="invalid('batchId')"
              />
            </div>
            <div class="field">
              <label class="field-label" for="cv-date">Admission date</label>
              <p-datepicker
                inputId="cv-date"
                formControlName="admissionDate"
                dateFormat="dd M yy"
                [showIcon]="true"
                iconDisplay="input"
                appendTo="body"
              />
            </div>
            <div class="field">
              <label class="field-label" for="cv-advisor">Advisor</label>
              <p-select
                inputId="cv-advisor"
                formControlName="advisorId"
                [options]="advisors.value()"
                optionLabel="label"
                optionValue="value"
                appendTo="body"
                [invalid]="invalid('advisorId')"
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend class="section-title mb-3">Fee plan</legend>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="field">
              <span class="field-label" id="cv-plan-label">Payment</span>
              <p-selectbutton
                formControlName="planType"
                [options]="planOptions"
                optionLabel="label"
                optionValue="value"
                [allowEmpty]="false"
                ariaLabelledBy="cv-plan-label"
              />
            </div>
            <div class="field">
              <label class="field-label" for="cv-inst">Installments</label>
              <p-select
                inputId="cv-inst"
                formControlName="installments"
                [options]="installmentOptions"
                optionLabel="label"
                optionValue="value"
                appendTo="body"
              />
            </div>
            <div class="field">
              <label class="field-label" for="cv-discount">Discount (₹)</label>
              <p-inputnumber
                inputId="cv-discount"
                formControlName="discount"
                mode="decimal"
                locale="en-IN"
                [min]="0"
                [max]="courseFee()"
              />
            </div>
          </div>

          @if (courseFee()) {
            <div class="mt-4 rounded-xl border border-line bg-surface-muted p-4">
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <p class="text-[13px] text-muted">
                  Course fee {{ courseFee() | inr }}
                  @if (values().discount) {
                    − discount {{ values().discount | inr }}
                  }
                </p>
                <p class="text-sm">
                  Net fee
                  <span class="ml-1 text-lg font-semibold tabular-nums">{{ netFee() | inr }}</span>
                </p>
              </div>
              <ol class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                @for (row of schedule(); track row.no) {
                  <li class="rounded-lg border border-line bg-white px-3 py-2">
                    <p class="text-xs text-muted">
                      {{
                        row.no === 1
                          ? row.total === 1
                            ? 'Full payment'
                            : 'Down payment'
                          : 'Installment ' + row.no
                      }}
                    </p>
                    <p class="text-sm font-semibold tabular-nums">{{ row.amount | inr }}</p>
                    <p class="text-xs text-muted">{{ row.due }}</p>
                  </li>
                }
              </ol>
            </div>
          }
        </fieldset>
      </form>
      <ng-template #footer>
        <button type="button" class="btn btn-secondary" (click)="visible.set(false)">Cancel</button>
        <button type="submit" form="convert-form" class="btn btn-primary" [disabled]="saving()">
          <svg lucideIcon="user-check" size="15" />
          {{ saving() ? 'Creating admission…' : 'Confirm admission' }}
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class ConvertAdmissionDialog {
  private readonly service = inject(AdmissionsService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly coursesService = inject(CoursesService);
  private readonly employees = inject(EmployeesService);

  readonly visible = model(false);
  readonly source = input<ConvertSource | null>(null);
  readonly converted = output<AdmissionView>();

  protected readonly todayIso = toIsoDate(new Date());
  protected readonly genders: Gender[] = ['Male', 'Female'];
  protected readonly relations: GuardianRelation[] = ['Father', 'Mother', 'Guardian', 'Spouse'];
  protected readonly planOptions = [
    { label: 'Full', value: 'Full' },
    { label: 'Installments', value: 'Installments' },
  ];
  protected readonly installmentOptions = [2, 3, 4].map((n) => ({
    label: `${n} installments`,
    value: n,
  }));
  protected readonly saving = signal(false);
  private readonly submitted = signal(false);

  protected readonly courses = rxResource({
    stream: () =>
      this.coursesService.getCourses().pipe(map((c) => c.filter((x) => x.status === 'Active'))),
    defaultValue: [],
  });
  private readonly batches = rxResource({
    stream: () => this.coursesService.getBatches(),
    defaultValue: [],
  });
  protected readonly advisors = rxResource({
    stream: () =>
      this.employees
        .getEmployees({ roles: ['Admin', 'Advisor'], status: 'Active' })
        .pipe(map((list) => list.map((e) => ({ label: e.name, value: e.id })))),
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
    dob: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    qualification: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
    city: new FormControl('Kochi', { nonNullable: true }),
    guardianName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    guardianRelation: new FormControl<GuardianRelation>('Father', { nonNullable: true }),
    guardianPhone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PHONE)],
    }),
    courseId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    batchId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    admissionDate: new FormControl<Date>(new Date(), { nonNullable: true }),
    advisorId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    planType: new FormControl<FeePlanType>('Installments', { nonNullable: true }),
    installments: new FormControl(3, { nonNullable: true }),
    discount: new FormControl(0, { nonNullable: true }),
  });

  protected readonly values = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    {
      initialValue: this.form.getRawValue(),
    },
  );

  protected readonly batchOptions = computed(() =>
    this.batches
      .value()
      .filter((b) => b.courseId === this.values().courseId && b.status !== 'Completed')
      .map((b) => ({
        label: `${b.code} · ${b.timing} (${b.enrolled}/${b.capacity})`,
        value: b.id,
      })),
  );
  protected readonly courseFee = computed(
    () => this.courses.value().find((c) => c.id === this.values().courseId)?.fee ?? 0,
  );
  protected readonly netFee = computed(() =>
    Math.max(this.courseFee() - (this.values().discount ?? 0), 0),
  );
  protected readonly schedule = computed(() => {
    const v = this.values();
    const count = v.planType === 'Full' ? 1 : v.installments;
    const net = this.netFee();
    const start = toIsoDate(v.admissionDate ?? new Date());
    if (count === 1) return [{ no: 1, total: 1, amount: net, due: formatDate(start) }];
    const down = Math.round((net * 0.3) / 500) * 500;
    const each = Math.round((net - down) / (count - 1) / 500) * 500;
    return Array.from({ length: count }, (_, i) => ({
      no: i + 1,
      total: count,
      amount: i === 0 ? down : i === count - 1 ? net - down - each * (count - 2) : each,
      due: formatDate(i === 0 ? start : addMonths(start, i)),
    }));
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      const src = this.source();
      this.submitted.set(false);
      this.form.reset({
        name: src?.name ?? '',
        gender: 'Male',
        phone: src?.phone ?? '',
        email: src?.email ?? '',
        dob: '',
        qualification: '',
        address: '',
        city: 'Kochi',
        guardianName: '',
        guardianRelation: 'Father',
        guardianPhone: '',
        courseId: src?.courseId ?? '',
        batchId: '',
        admissionDate: new Date(),
        advisorId: this.auth.user()?.employeeId ?? '',
        planType: 'Installments',
        installments: 3,
        discount: 0,
      });
    });
    // Reset batch when course changes and the batch no longer matches.
    this.form.controls.courseId.valueChanges.subscribe(() =>
      this.form.controls.batchId.setValue(''),
    );
    this.form.controls.planType.valueChanges.subscribe((plan) =>
      plan === 'Full'
        ? this.form.controls.installments.disable({ emitEvent: false })
        : this.form.controls.installments.enable({ emitEvent: false }),
    );
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  protected save(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Some details are missing', 'Please fill the highlighted fields.');
      return;
    }
    const v = this.form.getRawValue();
    const src = this.source();
    this.saving.set(true);
    this.service
      .convertToAdmission({
        sourceType: src?.type ?? 'Direct',
        sourceId: src?.id ?? null,
        name: v.name,
        gender: v.gender,
        dob: v.dob,
        phone: v.phone,
        email: v.email,
        address: v.address,
        city: v.city,
        qualification: v.qualification,
        guardian: {
          name: v.guardianName,
          relation: v.guardianRelation,
          phone: v.guardianPhone,
          occupation: '',
        },
        courseId: v.courseId,
        batchId: v.batchId,
        admissionDate: toIsoDate(v.admissionDate),
        advisorId: v.advisorId,
        planType: v.planType,
        discount: v.discount,
        installments: v.installments,
      })
      .subscribe({
        next: (admission) => {
          this.saving.set(false);
          this.visible.set(false);
          this.toast.success(
            'Admission created',
            `${admission.studentName} · ${admission.batchCode} (${admission.studentId})`,
          );
          this.converted.emit(admission);
          if (this.auth.hasRole('Admin', 'Advisor'))
            void this.router.navigate(['/students', admission.studentId]);
        },
        error: (e: Error) => {
          this.saving.set(false);
          this.toast.error('Could not create admission', e.message);
        },
      });
  }
}
