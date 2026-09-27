import { Component, computed, input } from '@angular/core';

/** Compact percentage bar (attendance %, capacity…). */
@Component({
  selector: 'app-meter',
  host: { class: 'flex items-center gap-2' },
  template: `
    <span
      class="relative h-1.5 w-full min-w-12 overflow-hidden rounded-full bg-neutral-100"
      role="progressbar"
      [attr.aria-valuenow]="value()"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-label]="ariaLabel()"
    >
      <span
        class="absolute inset-y-0 left-0 rounded-full"
        [class]="barClass()"
        [style.width.%]="clamped()"
      ></span>
    </span>
    @if (showValue()) {
      <span class="w-11 shrink-0 text-right text-xs font-medium text-ink tabular-nums"
        >{{ value() }}%</span
      >
    }
  `,
})
export class Meter {
  readonly value = input.required<number>();
  readonly showValue = input(true);
  /** Colour by threshold (for attendance). Off = always black. */
  readonly thresholds = input(true);
  readonly ariaLabel = input('Percentage');

  protected readonly clamped = computed(() => Math.min(Math.max(this.value(), 0), 100));
  protected readonly barClass = computed(() => {
    if (!this.thresholds()) return 'bg-indigo-500';
    const v = this.value();
    return v >= 85 ? 'bg-emerald-500' : v >= 75 ? 'bg-amber-500' : 'bg-rose-500';
  });
}
