import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InstituteProfile } from '../../../models';
import { Logo } from '../../../shared/ui/logo';
import { SettingsSection } from '../ui/settings-section';
import { settingsForm } from '../ui/settings-form';

const req = { nonNullable: true, validators: [Validators.required] };

@Component({
  selector: 'app-institute-settings',
  imports: [ReactiveFormsModule, InputTextModule, SettingsSection, Logo],
  template: `
    <app-settings-section
      title="Institute profile"
      description="Shown on receipts, payslips and the student portal."
      [saving]="ctl.saving()"
      [dirty]="ctl.dirty()"
      (save)="ctl.save()"
    >
      <div class="mb-6 flex items-center gap-4 rounded-xl border border-line bg-surface-muted p-4">
        <span class="rounded-lg border border-line bg-white px-3 py-2"
          ><app-logo [height]="28"
        /></span>
        <p class="text-[13px] text-muted">
          Logo is read from <code class="kbd">public/images/trycod-logo.png</code>. Replace the file
          to update it everywhere.
        </p>
      </div>
      <form class="form-grid" [formGroup]="form">
        <div class="field">
          <label class="field-label" for="in-name">Display name</label
          ><input pInputText id="in-name" formControlName="name" />
        </div>
        <div class="field">
          <label class="field-label" for="in-legal">Legal name</label
          ><input pInputText id="in-legal" formControlName="legalName" />
        </div>
        <div class="field sm:col-span-2">
          <label class="field-label" for="in-tag">Tagline</label
          ><input pInputText id="in-tag" formControlName="tagline" />
        </div>
        <div class="field">
          <label class="field-label" for="in-email">Email</label
          ><input pInputText id="in-email" formControlName="email" />
        </div>
        <div class="field">
          <label class="field-label" for="in-phone">Phone</label
          ><input pInputText id="in-phone" formControlName="phone" />
        </div>
        <div class="field">
          <label class="field-label" for="in-web">Website</label
          ><input pInputText id="in-web" formControlName="website" />
        </div>
        <div class="field">
          <label class="field-label" for="in-gst">GSTIN</label
          ><input pInputText id="in-gst" formControlName="gstin" class="uppercase" />
        </div>
        <div class="field sm:col-span-2">
          <label class="field-label" for="in-addr">Address</label
          ><input pInputText id="in-addr" formControlName="address" />
        </div>
        <div class="field">
          <label class="field-label" for="in-city">City</label
          ><input pInputText id="in-city" formControlName="city" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="field">
            <label class="field-label" for="in-state">State</label
            ><input pInputText id="in-state" formControlName="state" />
          </div>
          <div class="field">
            <label class="field-label" for="in-pin">PIN code</label
            ><input pInputText id="in-pin" formControlName="pincode" />
          </div>
        </div>
      </form>
    </app-settings-section>
  `,
})
export class InstituteSettings {
  protected readonly form = new FormGroup({
    name: new FormControl('', req),
    legalName: new FormControl('', req),
    tagline: new FormControl('', { nonNullable: true }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', req),
    website: new FormControl('', { nonNullable: true }),
    address: new FormControl('', req),
    city: new FormControl('', req),
    state: new FormControl('', req),
    pincode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
    gstin: new FormControl('', { nonNullable: true }),
  });
  protected readonly ctl = settingsForm(
    'institute',
    this.form,
    () => this.form.getRawValue() as InstituteProfile,
  );
}
