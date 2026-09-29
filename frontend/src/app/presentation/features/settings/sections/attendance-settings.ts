import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { AttendanceRules } from '../../../../domain/models';
import { SettingsSection } from '../ui/settings-section';
import { settingsForm } from '../ui/settings-form';

@Component({
  selector: 'app-attendance-settings',
  imports: [ReactiveFormsModule, InputNumberModule, InputTextModule, SettingsSection],
  template: `
    <app-settings-section
      title="Attendance rules"
      description="Used to classify check-ins as present, late or half day, and to raise alerts."
      [saving]="ctl.saving()"
      [dirty]="ctl.dirty()"
      (save)="ctl.save()"
    >
      <form [formGroup]="form" class="space-y-8">
        <fieldset>
          <legend class="section-title mb-4">Staff</legend>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="field">
              <label class="field-label" for="ar-start">Office starts</label
              ><input pInputText id="ar-start" type="time" formControlName="officeStart" />
            </div>
            <div class="field">
              <label class="field-label" for="ar-end">Office ends</label
              ><input pInputText id="ar-end" type="time" formControlName="officeEnd" />
            </div>
            <div class="field">
              <label class="field-label" for="ar-late">Late after (minutes)</label
              ><p-inputnumber
                inputId="ar-late"
                formControlName="staffLateAfterMin"
                [min]="0"
                [max]="120"
              />
            </div>
            <div class="field">
              <label class="field-label" for="ar-full">Full day (hours)</label
              ><p-inputnumber
                inputId="ar-full"
                formControlName="fullDayHours"
                [min]="1"
                [max]="12"
                [minFractionDigits]="0"
                [maxFractionDigits]="1"
              />
            </div>
            <div class="field">
              <label class="field-label" for="ar-half">Half day below (hours)</label
              ><p-inputnumber
                inputId="ar-half"
                formControlName="halfDayBelowHours"
                [min]="1"
                [max]="8"
                [maxFractionDigits]="1"
              />
            </div>
            <div class="field">
              <label class="field-label" for="ar-auto">Auto-mark absent after</label
              ><input pInputText id="ar-auto" type="time" formControlName="autoMarkAbsentAfter" />
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend class="section-title mb-4">Students</legend>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="field">
              <label class="field-label" for="ar-slate">Late after class start (minutes)</label
              ><p-inputnumber
                inputId="ar-slate"
                formControlName="studentLateAfterMin"
                [min]="0"
                [max]="60"
              />
            </div>
            <div class="field">
              <label class="field-label" for="ar-alert">Low attendance alert below</label
              ><p-inputnumber
                inputId="ar-alert"
                formControlName="lowAttendanceAlertPct"
                [min]="0"
                [max]="100"
                suffix="%"
              />
            </div>
          </div>
        </fieldset>
        <p class="rounded-lg bg-surface-muted px-4 py-3 text-[13px] text-muted">
          Biometric device sync will use these rules automatically once the device integration is
          enabled.
        </p>
      </form>
    </app-settings-section>
  `,
})
export class AttendanceSettings {
  protected readonly form = new FormGroup({
    officeStart: new FormControl('09:30', { nonNullable: true }),
    officeEnd: new FormControl('18:00', { nonNullable: true }),
    staffLateAfterMin: new FormControl(10, { nonNullable: true }),
    halfDayBelowHours: new FormControl(4, { nonNullable: true }),
    fullDayHours: new FormControl(8, { nonNullable: true }),
    studentLateAfterMin: new FormControl(15, { nonNullable: true }),
    lowAttendanceAlertPct: new FormControl(75, { nonNullable: true }),
    autoMarkAbsentAfter: new FormControl('12:00', { nonNullable: true }),
  });
  protected readonly ctl = settingsForm('attendance', this.form, (): AttendanceRules =>
    this.form.getRawValue(),
  );
}
