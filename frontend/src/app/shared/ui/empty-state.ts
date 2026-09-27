import { Component, input, output } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

/** Empty and error states with a helpful message and optional action. */
@Component({
  selector: 'app-empty-state',
  imports: [LucideDynamicIcon],
  host: { class: 'block' },
  template: `
    <div
      class="flex flex-col items-center justify-center px-6 py-12 text-center"
      [attr.role]="variant() === 'error' ? 'alert' : null"
    >
      <span
        class="grid size-11 place-items-center rounded-xl border"
        [class]="
          variant() === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-line bg-surface-muted text-ink'
        "
      >
        <svg
          [lucideIcon]="variant() === 'error' ? 'triangle-alert' : icon()"
          size="20"
          strokeWidth="1.75"
        />
      </span>
      <h3 class="mt-4 text-sm font-semibold text-ink">{{ title() }}</h3>
      @if (message()) {
        <p class="mt-1 max-w-sm text-[13px] text-muted">{{ message() }}</p>
      }
      @if (actionLabel()) {
        <button type="button" class="btn btn-secondary btn-sm mt-5" (click)="action.emit()">
          @if (actionIcon()) {
            <svg [lucideIcon]="actionIcon()!" size="14" />
          }
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly message = input<string>();
  readonly icon = input('inbox');
  readonly actionLabel = input<string>();
  readonly actionIcon = input<string>();
  readonly variant = input<'empty' | 'error'>('empty');
  readonly action = output<void>();
}
