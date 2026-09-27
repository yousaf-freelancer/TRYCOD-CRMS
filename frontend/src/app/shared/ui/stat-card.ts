import { Component, computed, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { TONE_BAR, TONE_TILE, Tone, toneForIcon } from './tones';

export type Trend = 'up' | 'down' | 'flat';

@Component({
  selector: 'app-stat-card',
  imports: [LucideDynamicIcon],
  host: { class: 'block' },
  template: `
    <div class="card relative h-full overflow-hidden p-4 transition-shadow hover:shadow-pop sm:p-5">
      <span class="absolute inset-x-0 top-0 h-[3px]" [class]="barClass()" aria-hidden="true"></span>
      <div class="flex items-start justify-between gap-3">
        <p class="min-w-0 text-[13px] leading-snug font-medium text-ink-secondary">{{ label() }}</p>
        <span
          class="grid size-9 shrink-0 place-items-center rounded-xl"
          [class]="tileClass()"
        >
          <svg [lucideIcon]="icon()" size="17" strokeWidth="2" />
        </span>
      </div>
      <p
        class="mt-3 text-[22px] leading-none font-semibold tracking-tight text-ink tabular-nums sm:text-[26px]"
      >
        {{ value() }}
      </p>
      <div class="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        @if (change()) {
          <span
            class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium"
            [class]="changeClass()"
          >
            @if (trend() === 'up') {
              <svg lucideIcon="arrow-up-right" size="12" strokeWidth="2" />
            } @else if (trend() === 'down') {
              <svg lucideIcon="arrow-down-right" size="12" strokeWidth="2" />
            }
            {{ change() }}
          </span>
        }
        @if (hint()) {
          <span class="truncate text-muted">{{ hint() }}</span>
        }
      </div>
    </div>
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input('circle');
  readonly change = input<string>();
  readonly trend = input<Trend>('flat');
  readonly hint = input<string>();
  /** Accent colour; picked from the icon when omitted. */
  readonly tone = input<Tone>();
  /** When true, a downward trend is good (e.g. pending fees going down). */
  readonly invertTrend = input(false);

  private readonly resolvedTone = computed(() => this.tone() ?? toneForIcon(this.icon(), this.label()));
  protected readonly tileClass = computed(() => TONE_TILE[this.resolvedTone()]);
  protected readonly barClass = computed(() => TONE_BAR[this.resolvedTone()]);

  protected readonly changeClass = computed(() => {
    const trend = this.trend();
    if (trend === 'flat') return 'bg-neutral-100 text-neutral-600';
    const good = (trend === 'up') !== this.invertTrend();
    return good
      ? 'bg-[var(--tc-success-bg)] text-[var(--tc-success-fg)]'
      : 'bg-[var(--tc-danger-bg)] text-[var(--tc-danger-fg)]';
  });
}
