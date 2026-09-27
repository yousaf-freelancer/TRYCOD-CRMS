import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { AuthService } from '../../../core/auth/auth.service';
import { LEAD_SOURCES, LEAD_STATUSES, LeadSource, LeadStatus, LeadView } from '../../../models';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdmissionsService } from '../data-access/admissions.service';
import { admissionsLookups } from '../ui/staff-options';

const PHONE = /^\+?[0-9\s-]{10,15}$/;

@Component({
  selector: 'app-lead-form-dialog',
  imports: [DialogModule, ReactiveFormsModule, InputTextModule, SelectModule, TextareaModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      [header]="lead() ? 'Edit lead' : 'Add lead'"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '40rem' }"
      [breakpoints]="{ '640px': '96vw' }"
      [dismissableMask]="true"
    >
      <form id="lead-form" class="form-grid" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="field sm:col-span-2">
          <label class="field-label" for="lead-name">Full name</label>
          <input
            pInputText
            id="lead-name"
            formControlName="name"
            [invalid]="invalid('name')"
            placeholder="e.g. Nandana Pillai"
          />
          @if (invalid('name')) {
            <p class="field-error">Name is required.</p>
          }
        </div>
        <div class="field">
          <label class="field-label" for="lead-phone">Phone</label>
          <input
            pInputText
            id="lead-phone"
            formControlName="phone"
            [invalid]="invalid('phone')"
            placeholder="+91 98470 12345"
          />
          @if (invalid('phone')) {
            <p class="field-error">Enter a valid phone number.</p>
          }
        </div>
        <div class="field">
          <label class="field-label" for="lead-email">Email</label>
          <input
            pInputText
            id="lead-email"
            type="email"
            formControlName="email"
            [invalid]="invalid('email')"
            placeholder="name@gmail.com"
          />
          @if (invalid('email')) {
            <p class="field-error">Enter a valid email.</p>
          }
        </div>
        <div class="field">
          <label class="field-label" for="lead-course">Course interested</label>
          <p-select
            inputId="lead-course"
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
          <label class="field-label" for="lead-source">Source</label>
          <p-select
            inputId="lead-source"
            formControlName="source"
            [options]="sources"
            placeholder="Select source"
            appendTo="body"
          />
        </div>
        <div class="field">
          <label class="field-label" for="lead-assigned">Assigned to</label>
          <p-select
            inputId="lead-assigned"
            formControlName="assignedTo"
            [options]="lookups.counsellors.value()"
            optionLabel="label"
            optionValue="value"
            placeholder="Select staff"
            appendTo="body"
            [filter]="true"
          />
        </div>
        <div class="field">
          <label class="field-label" for="lead-status">Status</label>
          <p-select
            inputId="lead-status"
            formControlName="status"
            [options]="statuses"
            appendTo="body"
          />
        </div>
        <div class="field sm:col-span-2">
          <label class="field-label" for="lead-notes">Notes</label>
          <textarea
            pTextarea
            id="lead-notes"
            formControlName="notes"
            rows="3"
            placeholder="Background, preferences, timing…"
          ></textarea>
        </div>
      </form>
      <ng-template #footer>
        <button type="button" class="btn btn-secondary" (click)="visible.set(false)">Cancel</button>
        <button type="submit" form="lead-form" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? 'Saving…' : lead() ? 'Save changes' : 'Add lead' }}
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class LeadFormDialog {
  private readonly service = inject(AdmissionsService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  readonly visible = model(false);
  readonly lead = input<LeadView | null>(null);
  readonly saved = output<void>();

  protected readonly lookups = admissionsLookups();
  protected readonly sources = [...LEAD_SOURCES];
  protected readonly statuses = [...LEAD_STATUSES];
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
    source: new FormControl<LeadSource>('Website', { nonNullable: true }),
    assignedTo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<LeadStatus>('New', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      const lead = this.lead();
      this.submitted.set(false);
      this.form.reset({
        name: lead?.name ?? '',
        phone: lead?.phone ?? '',
        email: lead?.email ?? '',
        courseId: lead?.courseId ?? '',
        source: lead?.source ?? 'Website',
        assignedTo: lead?.assignedTo ?? this.auth.user()?.employeeId ?? '',
        status: lead?.status ?? 'New',
        notes: lead?.notes ?? '',
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
    this.saving.set(true);
    const value = this.form.getRawValue();
    const lead = this.lead();
    const request = lead ? this.service.updateLead(lead.id, value) : this.service.createLead(value);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(lead ? 'Lead updated' : 'Lead added', value.name);
        this.visible.set(false);
        this.saved.emit();
      },
      error: (e: Error) => {
        this.saving.set(false);
        this.toast.error('Could not save lead', e.message);
      },
    });
  }
}
