import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { AuthService } from '../../../../core/auth/auth.service';
import { FollowUpView } from '../../../../domain/models';
import {
  addDays,
  hmFromMinutes,
  parseIsoDate,
  toIsoDate,
  todayIso,
} from '../../../../shared/utils/date.util';
import { ToastService } from '../../../../shared/ui/toast.service';
import { AdmissionsService } from '../../../../data/services/admissions.service';

export type FollowUpAction = 'complete' | 'reschedule' | 'note';

const TIMES = Array.from({ length: 19 }, (_, i) => hmFromMinutes(9 * 60 + i * 30)).map((t) => ({
  label: t,
  value: t,
}));

@Component({
  selector: 'app-follow-up-action-dialog',
  imports: [DialogModule, ReactiveFormsModule, DatePickerModule, SelectModule, TextareaModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      [header]="title()"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '30rem' }"
      [breakpoints]="{ '640px': '96vw' }"
    >
      @if (followUp(); as f) {
        <p class="mb-4 text-[13px] text-muted">
          <span class="font-medium text-ink">{{ f.name }}</span> · {{ f.phone }} · {{ f.purpose }}
        </p>
      }
      <form id="fu-action-form" [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
        @if (action() === 'reschedule') {
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="field">
              <label class="field-label" for="fa-date">New date</label>
              <p-datepicker
                inputId="fa-date"
                formControlName="date"
                dateFormat="dd M yy"
                [minDate]="today"
                [showIcon]="true"
                iconDisplay="input"
                appendTo="body"
              />
            </div>
            <div class="field">
              <label class="field-label" for="fa-time">Time</label>
              <p-select
                inputId="fa-time"
                formControlName="time"
                [options]="times"
                optionLabel="label"
                optionValue="value"
                appendTo="body"
              />
            </div>
          </div>
        }
        <div class="field">
          <label class="field-label" for="fa-note">{{
            action() === 'complete' ? 'Outcome' : action() === 'note' ? 'Note' : 'Reason (optional)'
          }}</label>
          <textarea
            pTextarea
            id="fa-note"
            formControlName="note"
            rows="3"
            [placeholder]="
              action() === 'complete'
                ? 'e.g. Interested, visiting campus on Saturday'
                : 'Add context for the team'
            "
          ></textarea>
          @if (action() === 'note' && form.controls.note.invalid && form.controls.note.touched) {
            <p class="field-error">Write a note before saving.</p>
          }
        </div>
      </form>
      <ng-template #footer>
        <button type="button" class="btn btn-secondary" (click)="visible.set(false)">Cancel</button>
        <button type="submit" form="fu-action-form" class="btn btn-primary" [disabled]="saving()">
          {{ cta() }}
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class FollowUpActionDialog {
  private readonly service = inject(AdmissionsService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  readonly visible = model(false);
  readonly action = input<FollowUpAction>('complete');
  readonly followUp = input<FollowUpView | null>(null);
  readonly done = output<void>();

  protected readonly today = parseIsoDate(todayIso());
  protected readonly times = TIMES;
  protected readonly saving = signal(false);
  protected readonly title = computed(
    () =>
      ({
        complete: 'Mark follow-up completed',
        reschedule: 'Reschedule follow-up',
        note: 'Add note',
      })[this.action()],
  );
  protected readonly cta = computed(
    () =>
      ({ complete: 'Mark completed', reschedule: 'Reschedule', note: 'Save note' })[this.action()],
  );

  protected readonly form = new FormGroup({
    date: new FormControl<Date>(parseIsoDate(addDays(todayIso(), 1)), { nonNullable: true }),
    time: new FormControl('11:00', { nonNullable: true }),
    note: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      const f = this.followUp();
      this.form.reset({
        date: parseIsoDate(addDays(todayIso(), 1)),
        time: f?.dueTime ?? '11:00',
        note: '',
      });
      this.form.controls.note.setValidators(this.action() === 'note' ? [Validators.required] : []);
      this.form.controls.note.updateValueAndValidity();
    });
  }

  protected save(): void {
    const f = this.followUp();
    this.form.markAllAsTouched();
    if (!f || this.form.invalid) return;
    const v = this.form.getRawValue();
    const by = this.auth.user()?.employeeId ?? '';
    this.saving.set(true);
    const request =
      this.action() === 'complete'
        ? this.service.completeFollowUp(f.id, v.note, by)
        : this.action() === 'reschedule'
          ? this.service.rescheduleFollowUp(f.id, toIsoDate(v.date), v.time, by)
          : this.service.addFollowUpNote(f.id, v.note, by);
    request.subscribe(() => {
      this.saving.set(false);
      this.visible.set(false);
      this.toast.success(
        this.action() === 'complete'
          ? 'Follow-up completed'
          : this.action() === 'reschedule'
            ? 'Follow-up rescheduled'
            : 'Note added',
        f.name,
      );
      this.done.emit();
    });
  }
}
