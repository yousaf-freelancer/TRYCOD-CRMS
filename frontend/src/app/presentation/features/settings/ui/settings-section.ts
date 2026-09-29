import { Component, input, output } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

/** Card wrapper for a settings form with a sticky save bar. */
@Component({
  selector: 'app-settings-section',
  imports: [LucideDynamicIcon],
  host: { class: 'block' },
  template: `
    <section class="card">
      <header class="border-b border-line px-6 py-5">
        <h2 class="text-base font-semibold">{{ title() }}</h2>
        @if (description()) {
          <p class="mt-1 text-[13px] text-muted">{{ description() }}</p>
        }
      </header>
      <div class="px-6 py-6"><ng-content /></div>
      @if (showSave()) {
        <footer
          class="flex items-center justify-end gap-3 rounded-b-card border-t border-line bg-surface-muted px-6 py-3"
        >
          @if (dirty()) {
            <span class="text-xs text-muted">Unsaved changes</span>
          }
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="saving() || !dirty()"
            (click)="save.emit()"
          >
            <svg
              [lucideIcon]="saving() ? 'loader-circle' : 'check'"
              size="15"
              [class.animate-spin]="saving()"
            />
            {{ saving() ? 'Saving…' : 'Save changes' }}
          </button>
        </footer>
      }
    </section>
  `,
})
export class SettingsSection {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly saving = input(false);
  readonly dirty = input(true);
  readonly showSave = input(true);
  readonly save = output<void>();
}
