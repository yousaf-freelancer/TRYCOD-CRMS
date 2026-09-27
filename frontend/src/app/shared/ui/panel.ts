import { Component, input } from '@angular/core';

/** Card with a header row (title, subtitle, actions) and body content. */
@Component({
  selector: 'app-panel',
  host: { class: 'card flex flex-col overflow-hidden' },
  template: `
    @if (title()) {
      <div
        class="flex items-start justify-between gap-3 px-5 pt-4 pb-3"
        [class.border-b]="divided()"
        [class.border-line]="divided()"
      >
        <div class="min-w-0">
          <h2 class="text-sm font-semibold text-ink">{{ title() }}</h2>
          @if (subtitle()) {
            <p class="mt-0.5 text-xs text-muted">{{ subtitle() }}</p>
          }
        </div>
        <div class="flex shrink-0 items-center gap-2"><ng-content select="[panel-actions]" /></div>
      </div>
    }
    <div class="min-h-0 flex-1" [class]="padded() ? 'px-5 pb-5' + (divided() ? ' pt-4' : '') : ''">
      <ng-content />
    </div>
  `,
})
export class Panel {
  readonly title = input<string>();
  readonly subtitle = input<string>();
  readonly padded = input(true);
  readonly divided = input(false);
}
