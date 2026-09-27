import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { AuthService } from '../../../core/auth/auth.service';
import {
  ENQUIRY_STATUSES,
  EnquiryStatus,
  EnquiryView,
  LEAD_SOURCES,
  LeadSource,
} from '../../../models';
import { dateToIso, parseIsoDate, todayIso } from '../../../shared/utils/date.util';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdmissionsService } from '../data-access/admissions.service';
import { admissionsLookups } from '../ui/staff-options';

const PHONE = /^\+?[0-9\s-]{10,15}$/;

@Component({
  selector: 'app-enquiry-form-dialog',
  imports: [
    DialogModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    DatePickerModule,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [header]="enquiry() ? 'Edit enquiry' : 'New enquiry'"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '40rem' }"
      [breakpoints]="{ '640px': '96vw' }"
    >
      <form id="enquiry-form" class="form-grid" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="field sm:col-span-2">
          <label class="field-label" for="enq-name">Full name</label>
          <input pInputText id="enq-name" formControlName="name" [invalid]="invalid('name')" />
          @if (invalid('name')) {
            <p class="field-error">Name is required.</p>
          }
        </div>
        <div class="field">
          <label class="field-label" for="enq-phone">Phone</label>
          <input
            pInputText
            id="enq-phone"
            formControlName="phone"
            [invalid]="invalid('phone')"
            placeholder="+91 98470 12345"
          />
        </div>
        <div class="field">
          <label class="field-label" for="enq-email">Email</label>
          <input
            pInputText
            id="enq-email"
            type="email"
            formControlName="email"
            [invalid]="invalid('email')"
          />
        </div>
        <div class="field">
          <label class="field-label" for="enq-course">Course</label>
          <p-select
            inputId="enq-course"
            formControlName="courseId"
            [options]="lookups.courses.value()"
            optionLabel="name"
            optionValue="id"
            placeholder="Select course"
            appendTo="body"
            [invalid]="invalid('courseId')"
          />
        </div>
        <div class="field">
          <label class="field-label" for="enq-source">Source</label>
          <p-select
            inputId="enq-source"
            formControlName="source"
            [options]="sources"
            appendTo="body"
          />
        </div>
        <div class="field">
          <label class="field-label" for="enq-assigned">Counsellor</label>
          <p-select
            inputId="enq-assigned"
            formControlName="assignedTo"
            [options]="lookups.counsellors.value()"
            optionLabel="label"
            optionValue="value"
            appendTo="body"
            [filter]="true"
            [invalid]="invalid('assignedTo')"
          />
        </div>
        <div class="field">
          <label class="field-label" for="enq-status">Status</label>
          <p-select
            inputId="enq-status"
            formControlName="status"
            [options]="statuses"
            appendTo="body"
          />
        </div>
        <div class="field">
          <label class="field-label" for="enq-next">Next follow-up</label>
          <p-datepicker
            inputId="enq-next"
            formControlName="nextFollowUp"
            dateFormat="dd M yy"
            [showIcon]="true"
            iconDisplay="input"
            [showClear]="true"
            appendTo="body"
          />
        </div>
        <div class="field sm:col-span-2">
          <label class="field-label" for="enq-remarks">Remarks</label>
          <textarea pTextarea id="enq-remarks" formControlName="remarks" rows="3"></textarea>
        </div>
      </form>
      <ng-template #footer>
        <button type="button" class="btn btn-secondary" (click)="visible.set(false)">Cancel</button>
        <button type="submit" form="enquiry-form" class="btn btn-primary" [disabled]="saving()">
          {{ enquiry() ? 'Save changes' : 'Create enquiry' }}
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class EnquiryFormDialog {
  private readonly service = inject(AdmissionsService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  readonly visible = model(false);
  readonly enquiry = input<EnquiryView | null>(null);
  readonly saved = output<void>();

  protected readonly lookups = admissionsLookups();
  protected readonly sources = [...LEAD_SOURCES];
  protected readonly statuses = [...ENQUIRY_STATUSES];
  protected readonly saving = signal(false);
  private readonly submitted = signal(false);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PHONE)],
    }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    courseId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    source: new FormControl<LeadSource>('Walk-in', { nonNullable: true }),
    assignedTo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<EnquiryStatus>('New', { nonNullable: true }),
    nextFollowUp: new FormControl<Date | null>(null),
    remarks: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      const e = this.enquiry();
      this.submitted.set(false);
      this.form.reset({
        name: e?.name ?? '',
        phone: e?.phone ?? '',
        email: e?.email ?? '',
        courseId: e?.courseId ?? '',
        source: e?.source ?? 'Walk-in',
        assignedTo: e?.assignedTo ?? this.auth.user()?.employeeId ?? '',
        status: e?.status ?? 'New',
        nextFollowUp: e?.nextFollowUp ? parseIsoDate(e.nextFollowUp) : null,
        remarks: e?.remarks ?? '',
      });
    });
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  protected save(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const e = this.enquiry();
    const payload = { ...v, nextFollowUp: dateToIso(v.nextFollowUp) };
    this.saving.set(true);
    const request = e
      ? this.service.updateEnquiry(e.id, payload)
      : this.service.createEnquiry({ ...payload, leadId: null, enquiryDate: todayIso() });
    request.subscribe(() => {
      this.saving.set(false);
      this.visible.set(false);
      this.toast.success(e ? 'Enquiry updated' : 'Enquiry created', v.name);
      this.saved.emit();
    });
  }
}
