import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthLayout } from './auth-layout';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, LucideDynamicIcon, InputTextModule, AuthLayout],
  template: `
    <app-auth-layout>
      @if (sentTo(); as email) {
        <div class="text-center">
          <span
            class="mx-auto grid size-12 place-items-center rounded-full bg-neutral-950 text-white"
          >
            <svg lucideIcon="mail-check" size="22" />
          </span>
          <h2 class="mt-5 text-2xl font-semibold tracking-tight">Check your inbox</h2>
          <p class="mt-2 text-sm text-muted">
            If an account exists for <span class="font-medium text-ink">{{ email }}</span
            >, you'll receive a link to reset your password.
          </p>
          <a routerLink="/login" class="btn btn-primary btn-lg mt-8 w-full">Back to sign in</a>
          <button
            type="button"
            class="mt-3 text-[13px] font-medium text-muted hover:text-ink"
            (click)="sentTo.set(null)"
          >
            Use a different email
          </button>
        </div>
      } @else {
        <a
          routerLink="/login"
          class="mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink"
        >
          <svg lucideIcon="arrow-left" size="14" /> Back to sign in
        </a>
        <h2 class="text-2xl font-semibold tracking-tight">Reset your password</h2>
        <p class="mt-1.5 text-sm text-muted">
          Enter your work email and we'll send you a reset link.
        </p>
        <form class="mt-8 space-y-5" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="reset-email" class="field-label">Email</label>
            <input
              pInputText
              id="reset-email"
              type="email"
              autocomplete="email"
              placeholder="you@trycod-demo.com"
              class="w-full"
              [formControl]="email"
              [invalid]="email.invalid && (email.touched || submitted())"
            />
            @if (email.invalid && (email.touched || submitted())) {
              <p class="field-error">Enter a valid email address.</p>
            }
          </div>
          <button type="submit" class="btn btn-primary btn-lg w-full" [disabled]="loading()">
            @if (loading()) {
              <svg lucideIcon="loader-circle" size="16" class="animate-spin" /> Sending link…
            } @else {
              Send reset link
            }
          </button>
        </form>
      }
    </app-auth-layout>
  `,
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);
  protected readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);
  protected readonly sentTo = signal<string | null>(null);

  protected submit(): void {
    this.submitted.set(true);
    if (this.email.invalid) return;
    this.loading.set(true);
    this.auth.requestPasswordReset(this.email.value).subscribe((res) => {
      this.loading.set(false);
      this.sentTo.set(res.email);
    });
  }
}
