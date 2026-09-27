import { Component, input, model } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-search-input',
  imports: [LucideDynamicIcon],
  host: { class: 'block' },
  template: `
    <label class="relative block">
      <span class="sr-only">{{ placeholder() }}</span>
      <svg
        lucideIcon="search"
        size="15"
        class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        type="search"
        class="h-9 w-full rounded-control border border-line-strong bg-white pr-3 pl-9 text-[13.5px] text-ink shadow-card transition-colors outline-none placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="value.set($any($event.target).value)"
      />
    </label>
  `,
})
export class SearchInput {
  readonly value = model('');
  readonly placeholder = input('Search…');
}
