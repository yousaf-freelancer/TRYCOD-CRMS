import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../core/auth/auth.service';
import { Avatar } from '../../../shared/ui/avatar';
import { ToastService } from '../../../shared/ui/toast.service';
import { SettingsSection } from '../ui/settings-section';

/** My profile / account — also used from the header "Profile" menu. */
@Component({
  selector: 'app-account-settings',
  imports: [ReactiveFormsModule, LucideDynamicIcon, InputTextModule, Avatar, SettingsSection],
  template: `
    @if (user(); as u) {
      <div class="space-y-6">
        <app-settings-section
          title="My profile"
          description="Your name and contact details as shown to colleagues."
          [showSave]="false"
        >
          <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
            <app-avatar [name]="u.name" size="xl" />
            <div class="min-w-0 flex-1">
              <p class="text-lg font-semibold">{{ u.name }}</p>
              <p class="text-[13px] text-muted">{{ u.title }} · {{ u.role }}</p>
              <p class="mt-1 text-[13px]">{{ u.email }}</p>
            </div>
            <span class="kbd">{{ u.employeeId ?? u.studentId }}</span>
          </div>
          <p class="mt-5 rounded-lg bg-surface-muted px-4 py-3 text-xs text-muted">
            To change your name, role or employee details, contact HR. Profile photos will be
            supported with the backend.
          </p>
        </app-settings-section>

        <app-settings-section
          title="Change password"
          description="Use at least 8 characters with a number and a symbol."
          [saving]="saving()"
          [dirty]="form.dirty"
          (save)="changePassword()"
        >
          <form [formGroup]="form" class="grid max-w-md gap-4" (ngSubmit)="changePassword()">
            <div class="field">
              <label class="field-label" for="pw-current">Current password</label>
              <input
                pInputText
                id="pw-current"
                type="password"
                formControlName="current"
                autocomplete="current-password"
              />
            </div>
            <div class="field">
              <label class="field-label" for="pw-new">New password</label>
              <input
                pInputText
                id="pw-new"
                type="password"
                formControlName="next"
                autocomplete="new-password"
                [invalid]="form.controls.next.invalid && form.controls.next.touched"
              />
              @if (form.controls.next.invalid && form.controls.next.touched) {
                <p class="field-error">At least 8 characters, including a number and a symbol.</p>
              }
            </div>
            <div class="field">
              <label class="field-label" for="pw-confirm">Confirm new password</label>
              <input
                pInputText
                id="pw-confirm"
                type="password"
                formControlName="confirm"
                autocomplete="new-password"
                [invalid]="mismatch()"
              />
              @if (mismatch()) {
                <p class="field-error">Passwords don't match.</p>
              }
            </div>
          </form>
        </app-settings-section>

        <app-settings-section title="Session" [showSave]="false">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-[13px] text-muted">
              Signed in on this browser. Demo sessions are stored locally only.
            </p>
            <button type="button" class="btn btn-danger" (click)="logout()">
              <svg lucideIcon="log-out" size="15" /> Sign out
            </button>
          </div>
        </app-settings-section>
      </div>
    }
  `,
})
export class AccountSettings {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly user = this.auth.user;
  protected readonly saving = signal(false);
  private readonly touched = signal(false);

  protected readonly form = new FormGroup({
    current: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    next: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^(?=.*\d)(?=.*[^\w\s]).{8,}$/)],
    }),
    confirm: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected mismatch(): boolean {
    return this.touched() && this.form.controls.confirm.value !== this.form.controls.next.value;
  }

  protected changePassword(): void {
    this.form.markAllAsTouched();
    this.touched.set(true);
    const v = this.form.getRawValue();
    if (this.form.invalid || v.next !== v.confirm) return;
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.form.reset();
      this.touched.set(false);
      this.toast.success('Password updated', 'Demo only — real password changes need the backend.');
    }, 600);
  }

  protected logout(): void {
    this.auth.logout();
    location.assign('/login');
  }
}
