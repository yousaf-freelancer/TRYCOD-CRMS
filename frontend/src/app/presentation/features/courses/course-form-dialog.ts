import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Course, CourseStatus } from '../../../domain/models';
import { ToastService } from '../../../shared/ui/toast.service';
import { CoursesService } from '../../../data/services/courses.service';

@Component({
  selector: 'app-course-form-dialog',
  imports: [
    DialogModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [header]="course() ? 'Edit course' : 'Add course'"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '38rem' }"
      [breakpoints]="{ '640px': '96vw' }"
    >
      <form id="course-form" class="form-grid" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="field sm:col-span-2">
          <label class="field-label" for="c-name">Course name</label>
          <input pInputText id="c-name" formControlName="name" [invalid]="bad('name')" />
        </div>
        <div class="field">
          <label class="field-label" for="c-code">Code</label>
          <input
            pInputText
            id="c-code"
            formControlName="code"
            class="uppercase"
            maxlength="5"
            [invalid]="bad('code')"
          />
          <p class="field-hint">Used in batch codes, e.g. FSD-2610A</p>
        </div>
        <div class="field">
          <label class="field-label" for="c-cat">Category</label>
          <p-select
            inputId="c-cat"
            formControlName="category"
            [options]="categories"
            [editable]="true"
            appendTo="body"
          />
        </div>
        <div class="field">
          <label class="field-label" for="c-dur">Duration (months)</label>
          <p-inputnumber
            inputId="c-dur"
            formControlName="durationMonths"
            [min]="1"
            [max]="24"
            [showButtons]="true"
          />
        </div>
        <div class="field">
          <label class="field-label" for="c-fee">Fee (₹)</label>
          <p-inputnumber
            inputId="c-fee"
            formControlName="fee"
            mode="decimal"
            locale="en-IN"
            [min]="0"
            [invalid]="bad('fee')"
          />
        </div>
        <div class="field">
          <label class="field-label" for="c-status">Status</label>
          <p-select
            inputId="c-status"
            formControlName="status"
            [options]="statuses"
            appendTo="body"
          />
        </div>
        <div class="field sm:col-span-2">
          <label class="field-label" for="c-desc">Description</label>
          <textarea pTextarea id="c-desc" formControlName="description" rows="3"></textarea>
        </div>
      </form>
      <ng-template #footer>
        <button type="button" class="btn btn-secondary" (click)="visible.set(false)">Cancel</button>
        <button type="submit" form="course-form" class="btn btn-primary" [disabled]="saving()">
          {{ course() ? 'Save changes' : 'Add course' }}
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class CourseFormDialog {
  private readonly service = inject(CoursesService);
  private readonly toast = inject(ToastService);

  readonly visible = model(false);
  readonly course = input<Course | null>(null);
  readonly saved = output<void>();

  protected readonly categories = ['Development', 'Data & AI', 'Design', 'Marketing', 'Quality'];
  protected readonly statuses: CourseStatus[] = ['Active', 'Inactive'];
  protected readonly saving = signal(false);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(5)],
    }),
    category: new FormControl('Development', { nonNullable: true }),
    durationMonths: new FormControl(4, { nonNullable: true }),
    fee: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    status: new FormControl<CourseStatus>('Active', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      const c = this.course();
      this.form.reset(
        c
          ? { ...c }
          : {
              name: '',
              code: '',
              category: 'Development',
              durationMonths: 4,
              fee: 0,
              status: 'Active',
              description: '',
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
    const v = { ...this.form.getRawValue(), code: this.form.getRawValue().code.toUpperCase() };
    const c = this.course();
    this.saving.set(true);
    (c ? this.service.updateCourse(c.id, v) : this.service.createCourse(v)).subscribe(() => {
      this.saving.set(false);
      this.visible.set(false);
      this.toast.success(c ? 'Course updated' : 'Course added', v.name);
      this.saved.emit();
    });
  }
}
