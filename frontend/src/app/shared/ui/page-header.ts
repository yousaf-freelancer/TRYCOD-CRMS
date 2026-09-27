import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  host: { class: 'block' },
  template: `
    <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="min-w-0">
        @if (eyebrow()) {
          <p class="mb-1 text-xs font-medium tracking-wide text-muted uppercase">{{ eyebrow() }}</p>
        }
        <h1 class="text-[22px] leading-tight font-semibold tracking-tight text-ink">
          {{ title() }}
        </h1>
        @if (subtitle()) {
          <p class="mt-1 text-sm text-muted">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <ng-content />
      </div>
    </div>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly eyebrow = input<string>();
}
