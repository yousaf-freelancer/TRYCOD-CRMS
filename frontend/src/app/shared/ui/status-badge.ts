import { Component, computed, input } from '@angular/core';

export type BadgeTone = 'success' | 'warn' | 'danger' | 'info' | 'neutral' | 'dark';

const TONES: Record<string, BadgeTone> = {
  Paid: 'success',
  Active: 'success',
  Present: 'success',
  Approved: 'success',
  Converted: 'success',
  Confirmed: 'success',
  Answered: 'success',
  Processed: 'success',
  Qualified: 'success',
  Ongoing: 'success',
  Verified: 'success',
  Partial: 'warn',
  Pending: 'warn',
  Late: 'warn',
  'Follow-up': 'warn',
  'Half Day': 'warn',
  'Pending Documents': 'warn',
  Draft: 'warn',
  Counselling: 'warn',
  Contacted: 'warn',
  Overdue: 'danger',
  Absent: 'danger',
  Rejected: 'danger',
  Lost: 'danger',
  Dropped: 'danger',
  Missed: 'danger',
  Cancelled: 'danger',
  New: 'info',
  'On Leave': 'info',
  Upcoming: 'info',
  Today: 'info',
  Completed: 'neutral',
  Closed: 'neutral',
  Inactive: 'neutral',
};

const CLASSES: Record<BadgeTone, string> = {
  success:
    'bg-[var(--tc-success-bg)] text-[var(--tc-success-fg)] border-[var(--tc-success-border)]',
  warn: 'bg-[var(--tc-warn-bg)] text-[var(--tc-warn-fg)] border-[var(--tc-warn-border)]',
  danger: 'bg-[var(--tc-danger-bg)] text-[var(--tc-danger-fg)] border-[var(--tc-danger-border)]',
  info: 'bg-[var(--tc-info-bg)] text-[var(--tc-info-fg)] border-[var(--tc-info-border)]',
  neutral: 'bg-neutral-50 text-neutral-600 border-neutral-200',
  dark: 'bg-neutral-950 text-white border-neutral-950',
};

/** Reusable status pill. Tone is inferred from the status text unless `tone` is set. */
@Component({
  selector: 'app-status-badge',
  host: { class: 'inline-flex' },
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] leading-4 font-medium whitespace-nowrap"
      [class]="classes()"
    >
      @if (dot()) {
        <span class="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true"></span>
      }
      {{ label() ?? status() }}
    </span>
  `,
})
export class StatusBadge {
  readonly status = input.required<string>();
  readonly label = input<string>();
  readonly tone = input<BadgeTone>();
  readonly dot = input(true);

  protected readonly classes = computed(
    () => CLASSES[this.tone() ?? TONES[this.status()] ?? 'neutral'],
  );
}
