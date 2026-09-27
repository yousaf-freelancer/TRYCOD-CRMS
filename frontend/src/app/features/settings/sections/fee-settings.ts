import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FeeSettings } from '../../../models';
import { SettingsSection } from '../ui/settings-section';
import { settingsForm } from '../ui/settings-form';

@Component({
  selector: 'app-fee-settings',
  imports: [
    ReactiveFormsModule,
    InputNumberModule,
    InputTextModule,
    SelectButtonModule,
    ToggleSwitchModule,
    SettingsSection,
  ],
  template: `
    <app-settings-section
      title="Fee settings"
      description="Installment rules, late fees and receipt numbering."
      [saving]="ctl.saving()"
      [dirty]="ctl.dirty()"
      (save)="ctl.save()"
    >
      <form [formGroup]="form" class="space-y-8">
        <fieldset>
          <legend class="section-title mb-4">Installments</legend>
          <label
            class="mb-4 flex items-center justify-between gap-4 rounded-xl border border-line p-4"
          >
            <span
              ><span class="block text-[13.5px] font-medium">Allow installment plans</span
              ><span class="text-xs text-muted"
                >Advisors can split course fees into installments at admission.</span
              ></span
            >
            <p-toggleswitch formControlName="allowInstallments" />
          </label>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="field">
              <label class="field-label" for="fs-max">Max installments</label
              ><p-inputnumber
                inputId="fs-max"
                formControlName="maxInstallments"
                [min]="2"
                [max]="12"
                [showButtons]="true"
              />
            </div>
            <div class="field">
              <label class="field-label" for="fs-down">Min. down payment (%)</label
              ><p-inputnumber
                inputId="fs-down"
                formControlName="minDownPaymentPct"
                [min]="0"
                [max]="100"
                suffix="%"
              />
            </div>
            <div class="field">
              <label class="field-label" for="fs-gap">Gap between installments (days)</label
              ><p-inputnumber
                inputId="fs-gap"
                formControlName="installmentGapDays"
                [min]="7"
                [max]="90"
              />
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend class="section-title mb-4">Late fee</legend>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="field">
              <span class="field-label" id="fs-type">Type</span
              ><p-selectbutton
                formControlName="lateFeeType"
                [options]="lateTypes"
                [allowEmpty]="false"
                ariaLabelledBy="fs-type"
              />
            </div>
            <div class="field">
              <label class="field-label" for="fs-late">{{
                form.controls.lateFeeType.value === 'Flat' ? 'Amount (₹)' : 'Percent of due (%)'
              }}</label
              ><p-inputnumber
                inputId="fs-late"
                formControlName="lateFeeValue"
                [min]="0"
                locale="en-IN"
              />
            </div>
            <div class="field">
              <label class="field-label" for="fs-grace">Grace period (days)</label
              ><p-inputnumber inputId="fs-grace" formControlName="graceDays" [min]="0" [max]="30" />
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend class="section-title mb-4">Receipts & reminders</legend>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="field">
              <label class="field-label" for="fs-prefix">Receipt prefix</label
              ><input pInputText id="fs-prefix" formControlName="receiptPrefix" />
              <p class="field-hint">e.g. TTS-10245</p>
            </div>
            <div class="field">
              <label class="field-label" for="fs-rem">Reminder before due (days)</label
              ><p-inputnumber
                inputId="fs-rem"
                formControlName="reminderDaysBefore"
                [min]="0"
                [max]="15"
              />
            </div>
          </div>
        </fieldset>
      </form>
    </app-settings-section>
  `,
})
export class FeeSettingsSection {
  protected readonly lateTypes = ['Flat', 'Percent'];
  protected readonly form = new FormGroup({
    allowInstallments: new FormControl(true, { nonNullable: true }),
    maxInstallments: new FormControl(4, { nonNullable: true }),
    minDownPaymentPct: new FormControl(30, { nonNullable: true }),
    installmentGapDays: new FormControl(30, { nonNullable: true }),
    lateFeeType: new FormControl<'Flat' | 'Percent'>('Flat', { nonNullable: true }),
    lateFeeValue: new FormControl(500, { nonNullable: true }),
    graceDays: new FormControl(5, { nonNullable: true }),
    receiptPrefix: new FormControl('TTS-', { nonNullable: true }),
    reminderDaysBefore: new FormControl(3, { nonNullable: true }),
  });
  protected readonly ctl = settingsForm('fees', this.form, (): FeeSettings =>
    this.form.getRawValue(),
  );
}
