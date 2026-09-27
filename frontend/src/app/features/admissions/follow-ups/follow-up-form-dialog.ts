import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { FollowUpChannel } from '../../../models';
import {
  addDays,
  hmFromMinutes,
  parseIsoDate,
  toIsoDate,
  todayIso,
} from '../../../shared/utils/date.util';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdmissionsService } from '../data-access/admissions.service';

export interface FollowUpTarget {
  relatedType: 'Lead' | 'Enquiry';
  relatedId: string;
  name: string;
  phone: string;
  courseId: string;
  assignedTo: string;
}

const TIMES = Array.from({ length: 19 }, (_, i) => hmFromMinutes(9 * 60 + i * 30)).map((t) => ({
  label: t,
  value: t,
}));

/** Schedules a new follow-up for a lead or enquiry. */
@Component({
  selector: 'app-follow-up-form-dialog',
  imports: [DialogModule, ReactiveFormsModule, DatePickerModule, SelectModule, InputTextModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      header="Schedule follow-up"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '30rem' }"
      [breakpoints]="{ '640px': '96vw' }"
    >
      @if (target(); as t) {
        <p class="mb-4 text-[13px] text-muted">
          For <span class="font-medium text-ink">{{ t.name }}</span> · {{ t.phone }}
        </p>
      }
      <form id="fu-form" class="form-grid" [formGroup]="form" (ngSubmit)="save()">
        <div class="field">
          <label class="field-label" for="fu-date">Date</label>
          <p-datepicker
            inputId="fu-date"
            formControlName="date"
            dateFormat="dd M yy"
            [minDate]="today"
            [showIcon]="true"
            iconDisplay="input"
            appendTo="body"
          />
        </div>
        <div class="field">
          <label class="field-label" for="fu-time">Time</label>
          <p-select
            inputId="fu-time"
            formControlName="time"
            [options]="times"
            optionLabel="label"
            optionValue="value"
            appendTo="body"
          />
        </div>
        <div class="field">
          <label class="field-label" for="fu-channel">Channel</label>
          <p-select
            inputId="fu-channel"
            formControlName="channel"
            [options]="channels"
            appendTo="body"
          />
        </div>
        <div class="field sm:col-span-2">
          <label class="field-label" for="fu-purpose">Purpose</label>
          <input
            pInputText
            id="fu-purpose"
            formControlName="purpose"
            placeholder="e.g. Share fee structure"
            [invalid]="form.controls.purpose.invalid && form.controls.purpose.touched"
          />
        </div>
      </form>
      <ng-template #footer>
        <button type="button" class="btn btn-secondary" (click)="visible.set(false)">Cancel</button>
        <button type="submit" form="fu-form" class="btn btn-primary" [disabled]="saving()">
          Schedule
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class FollowUpFormDialog {
  private readonly service = inject(AdmissionsService);
  private readonly toast = inject(ToastService);

  readonly visible = model(false);
  readonly target = input<FollowUpTarget | null>(null);
  readonly saved = output<void>();

  protected readonly today = parseIsoDate(todayIso());
  protected readonly times = TIMES;
  protected readonly channels: FollowUpChannel[] = ['Call', 'WhatsApp', 'Visit', 'Email'];
  protected readonly saving = signal(false);

  protected readonly form = new FormGroup({
    date: new FormControl<Date>(parseIsoDate(addDays(todayIso(), 1)), { nonNullable: true }),
    time: new FormControl('11:00', { nonNullable: true }),
    channel: new FormControl<FollowUpChannel>('Call', { nonNullable: true }),
    purpose: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    effect(() => {
      if (this.visible())
        this.form.reset({
          date: parseIsoDate(addDays(todayIso(), 1)),
          time: '11:00',
          channel: 'Call',
          purpose: '',
        });
    });
  }

  protected save(): void {
    const t = this.target();
    this.form.markAllAsTouched();
    if (!t || this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service
      .createFollowUp({
        ...t,
        dueDate: toIsoDate(v.date),
        dueTime: v.time,
        channel: v.channel,
        purpose: v.purpose,
      })
      .subscribe(() => {
        this.saving.set(false);
        this.visible.set(false);
        this.toast.success('Follow-up scheduled', `${t.name} · ${toIsoDate(v.date)} ${v.time}`);
        this.saved.emit();
      });
  }
}
