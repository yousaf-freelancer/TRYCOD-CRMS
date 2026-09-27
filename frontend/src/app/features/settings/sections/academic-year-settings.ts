import { Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AcademicYear } from '../../../models';
import { parseIsoDate, toIsoDate } from '../../../shared/utils/date.util';
import { SettingsSection } from '../ui/settings-section';
import { settingsForm } from '../ui/settings-form';

type HolidayGroup = FormGroup<{ date: FormControl<Date>; name: FormControl<string> }>;

@Component({
  selector: 'app-academic-year-settings',
  imports: [
    ReactiveFormsModule,
    LucideDynamicIcon,
    DatePickerModule,
    InputTextModule,
    SelectModule,
    SettingsSection,
  ],
  template: `
    <app-settings-section
      title="Academic year"
      description="Defines the working calendar used for attendance and leave quotas."
      [saving]="ctl.saving()"
      [dirty]="ctl.dirty()"
      (save)="ctl.save()"
    >
      <form [formGroup]="form" class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-4">
          <div class="field">
            <label class="field-label" for="ay-label">Label</label
            ><input pInputText id="ay-label" formControlName="label" />
          </div>
          <div class="field">
            <label class="field-label" for="ay-start">Starts</label
            ><p-datepicker
              inputId="ay-start"
              formControlName="startDate"
              dateFormat="dd M yy"
              appendTo="body"
            />
          </div>
          <div class="field">
            <label class="field-label" for="ay-end">Ends</label
            ><p-datepicker
              inputId="ay-end"
              formControlName="endDate"
              dateFormat="dd M yy"
              appendTo="body"
            />
          </div>
          <div class="field">
            <label class="field-label" for="ay-off">Weekly off</label
            ><p-select
              inputId="ay-off"
              formControlName="weeklyOff"
              [options]="days"
              appendTo="body"
            />
          </div>
        </div>
        <div>
          <div class="mb-3 flex items-center justify-between">
            <h3 class="section-title">Holidays</h3>
            <button type="button" class="btn btn-secondary btn-sm" (click)="addHoliday()">
              <svg lucideIcon="plus" size="14" /> Add holiday
            </button>
          </div>
          <ul
            class="divide-y divide-neutral-100 rounded-xl border border-line"
            formArrayName="holidays"
          >
            @for (h of holidays.controls; track h; let i = $index) {
              <li
                class="grid grid-cols-[160px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2"
                [formGroupName]="i"
              >
                <p-datepicker
                  formControlName="date"
                  dateFormat="dd M yy"
                  appendTo="body"
                  [inputId]="'hd-' + i"
                  ariaLabel="Holiday date"
                />
                <input
                  pInputText
                  formControlName="name"
                  placeholder="Holiday name"
                  [attr.aria-label]="'Holiday name ' + (i + 1)"
                />
                <button
                  type="button"
                  class="btn btn-ghost btn-icon btn-sm"
                  [attr.aria-label]="'Remove holiday ' + (i + 1)"
                  (click)="removeHoliday(i)"
                >
                  <svg lucideIcon="x" size="15" />
                </button>
              </li>
            } @empty {
              <li class="px-4 py-6 text-center text-[13px] text-muted">No holidays added.</li>
            }
          </ul>
        </div>
      </form>
    </app-settings-section>
  `,
})
export class AcademicYearSettings {
  protected readonly days = ['Sunday', 'Saturday', 'Saturday & Sunday'];
  protected readonly holidays = new FormArray<HolidayGroup>([]);
  protected readonly form = new FormGroup({
    label: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    startDate: new FormControl<Date>(new Date(), { nonNullable: true }),
    endDate: new FormControl<Date>(new Date(), { nonNullable: true }),
    weeklyOff: new FormControl('Sunday', { nonNullable: true }),
    holidays: this.holidays,
  });

  protected readonly ctl = settingsForm(
    'academicYear',
    this.form,
    (): AcademicYear => {
      const v = this.form.getRawValue();
      return {
        label: v.label,
        startDate: toIsoDate(v.startDate),
        endDate: toIsoDate(v.endDate),
        weeklyOff: v.weeklyOff,
        holidays: v.holidays
          .map((h) => ({ date: toIsoDate(h.date), name: h.name }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      };
    },
    (y) => {
      this.holidays.clear();
      y.holidays.forEach((h) => this.holidays.push(this.holiday(parseIsoDate(h.date), h.name)));
      this.form.patchValue({
        label: y.label,
        startDate: parseIsoDate(y.startDate),
        endDate: parseIsoDate(y.endDate),
        weeklyOff: y.weeklyOff,
      });
    },
  );

  private holiday(date: Date, name: string): HolidayGroup {
    return new FormGroup({
      date: new FormControl(date, { nonNullable: true }),
      name: new FormControl(name, { nonNullable: true, validators: [Validators.required] }),
    });
  }

  protected addHoliday(): void {
    this.holidays.push(this.holiday(new Date(), ''));
    this.form.markAsDirty();
  }

  protected removeHoliday(i: number): void {
    this.holidays.removeAt(i);
    this.form.markAsDirty();
  }
}
