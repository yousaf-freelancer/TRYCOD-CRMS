import { Component, input } from '@angular/core';

export interface DetailItem {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
}

/** Label / value grid for profile and detail views. */
@Component({
  selector: 'app-detail-list',
  host: { class: 'block' },
  template: `
    <dl
      class="grid gap-x-6 gap-y-4"
      [class]="
        columns() === 2 ? 'sm:grid-cols-2' : columns() === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : ''
      "
    >
      @for (item of items(); track item.label) {
        <div class="min-w-0">
          <dt class="text-xs text-muted">{{ item.label }}</dt>
          <dd
            class="mt-0.5 text-[13.5px] font-medium break-words text-ink"
            [class.mono]="item.mono"
          >
            {{
              item.value === null || item.value === undefined || item.value === ''
                ? '—'
                : item.value
            }}
          </dd>
        </div>
      }
    </dl>
  `,
})
export class DetailList {
  readonly items = input.required<DetailItem[]>();
  readonly columns = input<1 | 2 | 3>(2);
}
