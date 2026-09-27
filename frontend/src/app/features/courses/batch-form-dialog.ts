import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { BatchMode, BatchStatus, BatchView } from '../../models';
import { addMonths, parseIsoDate, toIsoDate } from '../../shared/utils/date.util';
import { ToastService } from '../../shared/ui/toast.service';
import { EmployeesService } from '../hr/data-access/employees.service';
import { CoursesService } from './data-access/courses.service';

const TIMINGS = [
  '09:30 AM – 12:30 PM',
  '10:00 AM – 01:00 PM',
  '02:00 PM – 05:00 PM',
  '06:00 PM – 08:30 PM',
  'Sat & Sun 10:00 AM – 04:00 PM',
];

@Component({
  selector: 'app-batch-form-dialog',
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
      [header]="batch() ? 'Edit batch' : 'Create batch'"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '40rem' }"
      [breakpoints]="{ '640px': '96vw' }"
    >
      <form id="batch-form" class="form-grid" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="field">
          <label class="field-label" for="b-course">Course</label>
          <p-select
            inputId="b-course"
            formControlName="courseId"
            [options]="courses.value()"
            optionLabel="name"
            optionValue="id"
            placeholder="Select course"
            appendTo="body"
            [invalid]="bad('courseId')"
          />
        </div>
        <div class="field">
          <label class="field-label" for="b-code">Batch code</label>
          <input
            pInputText
            id="b-code"
            formControlName="code"
            class="uppercase"
            placeholder="FSD-2610C"
            [invalid]="bad('code')"
          />
        </div>
        <div class="field">
          <label class="field-label" for="b-mentor">Mentor</label>
          <p-select
            inputId="b-mentor"
            formControlName="mentorId"
            [options]="mentors.value()"
            optionLabel="label"
            optionValue="value"
            placeholder="Select mentor"
            appendTo="body"
            [invalid]="bad('mentorId')"
          />
        </div>
        <div class="field">
          <label class="field-label" for="b-timing">Timing</label>
          <p-select
            inputId="b-timing"
            formControlName="timing"
            [options]="timings"
            [editable]="true"
            appendTo="body"
          />
        </div>
        <div class="field">
          <label class="field-label" for="b-start">Start date</label>
          <p-datepicker
            inputId="b-start"
            formControlName="startDate"
            dateFormat="dd M yy"
            [showIcon]="true"
            iconDisplay="input"
            appendTo="body"
          />
        </div>
        <div class="field">
          <label class="field-label" for="b-cap">Capacity</label>
          <p-inputnumber
            inputId="b-cap"
            formControlName="capacity"
            [min]="1"
            [max]="60"
            [showButtons]="true"
          />
        </div>
        <div class="field">
          <label class="field-label" for="b-mode">Mode</label>
          <p-select inputId="b-mode" formControlName="mode" [options]="modes" appendTo="body" />
        </div>
        <div class="field">
          <label class="field-label" for="b-status">Status</label>
          <p-select
            inputId="b-status"
            formControlName="status"
            [options]="statuses"
            appendTo="body"
          />
        </div>
      </form>
      <ng-template #footer>
        <button type="button" class="btn btn-secondary" (click)="visible.set(false)">Cancel</button>
        <button type="submit" form="batch-form" class="btn btn-primary" [disabled]="saving()">
          {{ batch() ? 'Save changes' : 'Create batch' }}
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class BatchFormDialog {
  private readonly service = inject(CoursesService);
  private readonly employees = inject(EmployeesService);
  private readonly toast = inject(ToastService);

  readonly visible = model(false);
  readonly batch = input<BatchView | null>(null);
  readonly saved = output<void>();

  protected readonly timings = TIMINGS;
  protected readonly modes: BatchMode[] = ['Classroom', 'Hybrid', 'Online'];
  protected readonly statuses: BatchStatus[] = ['Upcoming', 'Ongoing', 'Completed'];
  protected readonly saving = signal(false);

  protected readonly courses = rxResource({
    stream: () => this.service.getCourses(),
    defaultValue: [],
  });
  protected readonly mentors = rxResource({
    stream: () =>
      this.employees
        .getEmployees({ roles: ['Mentor'], status: 'Active' })
        .pipe(map((l) => l.map((e) => ({ label: e.name, value: e.id })))),
    defaultValue: [],
  });

  protected readonly form = new FormGroup({
    courseId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    mentorId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    timing: new FormControl(TIMINGS[0], { nonNullable: true }),
    startDate: new FormControl<Date>(new Date(), { nonNullable: true }),
    capacity: new FormControl(25, { nonNullable: true }),
    mode: new FormControl<BatchMode>('Classroom', { nonNullable: true }),
    status: new FormControl<BatchStatus>('Upcoming', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      const b = this.batch();
      this.form.reset(
        b
          ? {
              courseId: b.courseId,
              code: b.code,
              mentorId: b.mentorId,
              timing: b.timing,
              startDate: parseIsoDate(b.startDate),
              capacity: b.capacity,
              mode: b.mode,
              status: b.status,
            }
          : {
              courseId: '',
              code: '',
              mentorId: '',
              timing: TIMINGS[0],
              startDate: new Date(),
              capacity: 25,
              mode: 'Classroom',
              status: 'Upcoming',
            },
      );
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
    const months = this.courses.value().find((c) => c.id === v.courseId)?.durationMonths ?? 4;
    const startDate = toIsoDate(v.startDate);
    const input = {
      ...v,
      code: v.code.toUpperCase(),
      startDate,
      endDate: addMonths(startDate, months),
    };
    const b = this.batch();
    this.saving.set(true);
    (b ? this.service.updateBatch(b.id, input) : this.service.createBatch(input)).subscribe(() => {
      this.saving.set(false);
      this.visible.set(false);
      this.toast.success(b ? 'Batch updated' : 'Batch created', input.code);
      this.saved.emit();
    });
  }
}
