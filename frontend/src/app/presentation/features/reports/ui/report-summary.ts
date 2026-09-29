import { Component, input } from '@angular/core';

export interface SummaryItem {
  label: string;
  value: string | number;
  hint?: string;
}

/** Compact row of summary figures for report pages. */
@Component({
  selector: 'app-report-summary',
  host: { class: 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4' },
  template: `
    @for (s of items(); track s.label) {
      <div class="card px-5 py-4">
        <p class="text-xs text-muted">{{ s.label }}</p>
        <p class="mt-1 text-xl font-semibold tracking-tight tabular-nums">{{ s.value }}</p>
        @if (s.hint) {
          <p class="mt-0.5 text-xs text-muted">{{ s.hint }}</p>
        }
      </div>
    }
  `,
})
export class ReportSummary {
  readonly items = input.required<SummaryItem[]>();
}
