import { Component, computed, input } from '@angular/core';
import { FunnelStats } from '../../../../domain/models';

/** Horizontal funnel bars: leads → enquiries → admissions. */
@Component({
  selector: 'app-funnel',
  host: { class: 'block' },
  template: `
    <ol class="space-y-4">
      @for (step of steps(); track step.label; let i = $index) {
        <li>
          <div class="mb-1.5 flex items-baseline justify-between text-[13px]">
            <span class="font-medium text-ink">{{ step.label }}</span>
            <span class="text-muted tabular-nums">
              <span class="font-semibold text-ink">{{ step.value }}</span>
              @if (i > 0) {
                <span class="ml-1.5 text-xs">({{ step.rate }}%)</span>
              }
            </span>
          </div>
          <div class="h-7 overflow-hidden rounded-md bg-neutral-100">
            <div
              class="h-full rounded-md transition-all duration-500"
              [class]="shades[i]"
              [style.width.%]="step.width"
            ></div>
          </div>
        </li>
      }
    </ol>
    <p class="mt-4 text-xs text-muted">
      Lead → admission conversion: <span class="font-semibold text-ink">{{ overall() }}%</span>
    </p>
  `,
})
export class Funnel {
  readonly data = input.required<FunnelStats>();
  protected readonly shades = ['bg-indigo-500', 'bg-violet-500', 'bg-emerald-500'];

  protected readonly steps = computed(() => {
    const { leads, enquiries, admissions } = this.data();
    const max = Math.max(leads, 1);
    return [
      { label: 'Leads', value: leads, width: 100, rate: 100 },
      {
        label: 'Enquiries',
        value: enquiries,
        width: (enquiries / max) * 100,
        rate: rate(enquiries, leads),
      },
      {
        label: 'Admissions',
        value: admissions,
        width: (admissions / max) * 100,
        rate: rate(admissions, enquiries),
      },
    ];
  });
  protected readonly overall = computed(() => rate(this.data().admissions, this.data().leads));
}

function rate(part: number, whole: number): number {
  return whole ? Math.round((part / whole) * 100) : 0;
}
