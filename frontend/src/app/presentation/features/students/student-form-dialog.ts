import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Gender, GuardianRelation, Student, StudentStatus } from '../../../domain/models';
import { ToastService } from '../../../shared/ui/toast.service';
import { CoursesService } from '../../../data/services/courses.service';
import { StudentsService } from '../../../data/services/students.service';
import { map, startWith } from 'rxjs';

const PHONE = /^\+?[0-9\s-]{10,15}$/;

/** Edits an existing student's profile, batch and status. New students come in via admissions. */
@Component({
  selector: 'app-student-form-dialog',
  imports: [DialogModule, ReactiveFormsModule, InputTextModule, SelectModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      header="Edit student"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '46rem' }"
      [breakpoints]="{ '768px': '96vw' }"
      [contentStyle]="{ 'max-height': '72vh' }"
    >
      <form id="student-form" [formGroup]="form" (ngSubmit)="save()" class="space-y-6" novalidate>
        <div class="form-grid">
          <div class="field">
            <label class="field-label" for="st-name">Full name</label>
            <input pInputText id="st-name" formControlName="name" [invalid]="bad('name')" />
          </div>
          <div class="field">
            <label class="field-label" for="st-gender">Gender</label>
            <p-select
              inputId="st-gender"
              formControlName="gender"
              [options]="genders"
              appendTo="body"
            />
          </div>
          <div class="field">
            <label class="field-label" for="st-phone">Phone</label>
            <input pInputText id="st-phone" formControlName="phone" [invalid]="bad('phone')" />
          </div>
          <div class="field">
            <label class="field-label" for="st-email">Email</label>
            <input pInputText id="st-email" formControlName="email" [invalid]="bad('email')" />
          </div>
          <div class="field">
            <label class="field-label" for="st-dob">Date of birth</label>
            <input pInputText type="date" id="st-dob" formControlName="dob" />
          </div>
          <div class="field">
            <label class="field-label" for="st-qual">Qualification</label>
            <input pInputText id="st-qual" formControlName="qualification" />
          </div>
          <div class="field">
            <label class="field-label" for="st-address">Address</label>
            <input pInputText id="st-address" formControlName="address" />
          </div>
          <div class="field">
            <label class="field-label" for="st-city">City</label>
            <input pInputText id="st-city" formControlName="city" />
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-3">
          <div class="field">
            <label class="field-label" for="st-gname">Guardian name</label>
            <input pInputText id="st-gname" formControlName="guardianName" />
          </div>
          <div class="field">
            <label class="field-label" for="st-grel">Relation</label>
            <p-select
              inputId="st-grel"
              formControlName="guardianRelation"
              [options]="relations"
              appendTo="body"
            />
          </div>
          <div class="field">
            <label class="field-label" for="st-gphone">Guardian phone</label>
            <input pInputText id="st-gphone" formControlName="guardianPhone" />
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-3">
          <div class="field">
            <label class="field-label" for="st-course">Course</label>
            <p-select
              inputId="st-course"
              formControlName="courseId"
              [options]="courses.value()"
              optionLabel="name"
              optionValue="id"
              appendTo="body"
            />
          </div>
          <div class="field">
            <label class="field-label" for="st-batch">Batch</label>
            <p-select
              inputId="st-batch"
              formControlName="batchId"
              [options]="batchOptions()"
              optionLabel="label"
              optionValue="value"
              appendTo="body"
              [invalid]="bad('batchId')"
            />
          </div>
          <div class="field">
            <label class="field-label" for="st-status">Status</label>
            <p-select
              inputId="st-status"
              formControlName="status"
              [options]="statuses"
              appendTo="body"
            />
          </div>
        </div>
      </form>
      <ng-template #footer>
        <button type="button" class="btn btn-secondary" (click)="visible.set(false)">Cancel</button>
        <button type="submit" form="student-form" class="btn btn-primary" [disabled]="saving()">
          Save changes
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class StudentFormDialog {
  private readonly service = inject(StudentsService);
  private readonly coursesService = inject(CoursesService);
  private readonly toast = inject(ToastService);

  readonly visible = model(false);
  readonly student = input<Student | null>(null);
  readonly saved = output<void>();

  protected readonly genders: Gender[] = ['Male', 'Female'];
  protected readonly relations: GuardianRelation[] = ['Father', 'Mother', 'Guardian', 'Spouse'];
  protected readonly statuses: StudentStatus[] = ['Active', 'Completed', 'Dropped'];
  protected readonly saving = signal(false);

  protected readonly courses = rxResource({
    stream: () => this.coursesService.getCourses(),
    defaultValue: [],
  });
  private readonly batches = rxResource({
    stream: () => this.coursesService.getBatches(),
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
    dob: new FormControl('2003-01-01', { nonNullable: true }),
    qualification: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true }),
    guardianName: new FormControl('', { nonNullable: true }),
    guardianRelation: new FormControl<GuardianRelation>('Father', { nonNullable: true }),
    guardianPhone: new FormControl('', { nonNullable: true }),
    courseId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    batchId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<StudentStatus>('Active', { nonNullable: true }),
  });

  private readonly courseId = toSignal(
    this.form.controls.courseId.valueChanges.pipe(
      startWith(''),
      map(() => this.form.controls.courseId.value),
    ),
    { initialValue: '' },
  );
  protected readonly batchOptions = computed(() =>
    this.batches
      .value()
      .filter((b) => b.courseId === this.courseId())
      .map((b) => ({ label: `${b.code} · ${b.status}`, value: b.id })),
  );

  constructor() {
    effect(() => {
      const s = this.student();
      if (!this.visible() || !s) return;
      this.form.reset({
        name: s.name,
        gender: s.gender,
        phone: s.phone,
        email: s.email,
        dob: s.dob,
        qualification: s.qualification,
        address: s.address,
        city: s.city,
        guardianName: s.guardian.name,
        guardianRelation: s.guardian.relation,
        guardianPhone: s.guardian.phone,
        courseId: s.courseId,
        batchId: s.batchId,
        status: s.status,
      });
    });
  }

  protected bad(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && c.touched;
  }

  protected save(): void {
    const s = this.student();
    this.form.markAllAsTouched();
    if (!s || this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service
      .updateStudent(s.id, {
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
          occupation: s.guardian.occupation,
        },
        courseId: v.courseId,
        batchId: v.batchId,
        admissionDate: s.admissionDate,
        status: v.status,
      })
      .subscribe(() => {
        this.saving.set(false);
        this.visible.set(false);
        this.toast.success('Student updated', v.name);
        this.saved.emit();
      });
  }
}
