import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthLayout } from './auth-layout';
import { TEST_ACCOUNTS, TestAccount } from './test-accounts';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, LucideDynamicIcon, InputTextModule, AuthLayout],
  template: `
    <app-auth-layout>
      <h2 class="text-2xl font-semibold tracking-tight">Welcome back</h2>
      <p class="mt-1.5 text-sm text-muted">Sign in to continue</p>

      <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (error()) {
          <div
            class="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-800"
            role="alert"
          >
            <svg lucideIcon="circle-alert" size="16" class="mt-0.5 shrink-0" />
            {{ error() }}
          </div>
        }

        <div class="field">
          <label for="identifier" class="field-label">Email or phone</label>
          <input
            pInputText
            id="identifier"
            type="text"
            formControlName="identifier"
            autocomplete="username"
            placeholder="you@example.com"
            class="w-full"
            [invalid]="showError('identifier')"
            [attr.aria-describedby]="showError('identifier') ? 'identifier-error' : null"
          />
          @if (showError('identifier')) {
            <p id="identifier-error" class="field-error">Enter your email or phone number.</p>
          }
        </div>

        <div class="field">
          <label for="password" class="field-label">Password</label>
          <div class="relative">
            <input
              pInputText
              id="password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full !pr-10"
              [invalid]="showError('password')"
              [attr.aria-describedby]="showError('password') ? 'password-error' : null"
            />
            <button
              type="button"
              class="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-neutral-100 hover:text-ink"
              [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
              [attr.aria-pressed]="showPassword()"
              (click)="showPassword.set(!showPassword())"
            >
              <svg [lucideIcon]="showPassword() ? 'eye-off' : 'eye'" size="16" />
            </button>
          </div>
          @if (showError('password')) {
            <p id="password-error" class="field-error">Password is required.</p>
          }
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-full" [disabled]="loading()">
          @if (loading()) {
            <svg lucideIcon="loader-circle" size="16" class="animate-spin" />
            Signing in…
          } @else {
            Sign in
            <svg lucideIcon="arrow-right" size="16" />
          }
        </button>
      </form>

      <!-- TEMPORARY: test accounts (see test-accounts.ts) -->
      <div class="my-8 flex items-center gap-3" role="separator">
        <span class="h-px flex-1 bg-line"></span>
        <span class="text-[11px] font-medium tracking-wider text-muted uppercase">Test accounts</span>
        <span class="h-px flex-1 bg-line"></span>
      </div>
      <div class="flex flex-wrap gap-2" role="group" aria-label="Fill test credentials">
        @for (account of testAccounts; track account.label) {
          <button
            type="button"
            class="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors"
            [class]="
              selected() === account.label
                ? 'border-neutral-950 bg-neutral-950 text-white'
                : 'border-dashed border-neutral-300 bg-white text-ink-secondary hover:border-neutral-500 hover:text-ink'
            "
            [attr.aria-pressed]="selected() === account.label"
            (click)="fill(account)"
          >
            <svg [lucideIcon]="account.icon" size="13" strokeWidth="2" />
            {{ account.label }}
          </button>
        }
      </div>
      <p class="mt-3 text-xs leading-relaxed text-muted">
        Buttons only fill the credentials — press
        <span class="font-medium text-ink">Sign in</span> to continue.
      </p>
    </app-auth-layout>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly testAccounts = TEST_ACCOUNTS;
  protected readonly selected = signal<string | null>(null);

  protected readonly form = new FormGroup({
    identifier: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected showError(name: 'identifier' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  protected fill(account: TestAccount): void {
    this.selected.set(account.label);
    this.error.set(null);
    this.form.patchValue({ identifier: account.identifier, password: account.password });
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(this.auth.homeUrl()),
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
