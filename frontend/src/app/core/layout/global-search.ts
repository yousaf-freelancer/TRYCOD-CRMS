import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { SearchResult, SearchService } from '../search/search.service';

/** Header search with keyboard navigation (⌘/Ctrl + K to focus). */
@Component({
  selector: 'app-global-search',
  imports: [LucideDynamicIcon],
  host: {
    class: 'relative block',
    '(document:keydown)': 'onGlobalKey($event)',
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div class="relative">
      <svg
        lucideIcon="search"
        size="15"
        class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        #input
        type="text"
        role="combobox"
        aria-label="Search students, leads, employees and pages"
        [attr.aria-expanded]="open()"
        aria-controls="global-search-results"
        [attr.aria-activedescendant]="open() && results().length ? 'gs-' + active() : null"
        autocomplete="off"
        placeholder="Search students, leads, pages…"
        class="h-9 w-full rounded-control border border-line bg-surface-muted pr-14 pl-9 text-[13.5px] text-ink transition-colors outline-none placeholder:text-neutral-400 hover:border-line-strong focus:border-neutral-900 focus:bg-white"
        [value]="query()"
        (input)="onInput($any($event.target).value)"
        (focus)="open.set(query().length > 0)"
        (keydown)="onKey($event)"
      />
      <span
        class="kbd pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 sm:inline"
        >Ctrl K</span
      >
    </div>

    @if (open()) {
      <div
        id="global-search-results"
        role="listbox"
        class="absolute top-full right-0 left-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-pop"
      >
        @if (loading()) {
          <p class="px-3 py-6 text-center text-sm text-muted">Searching…</p>
        } @else if (!results().length) {
          <p class="px-3 py-6 text-center text-sm text-muted">No results for “{{ query() }}”.</p>
        } @else {
          @for (group of groups(); track group.name) {
            <p
              class="px-2.5 pt-2 pb-1 text-[11px] font-medium tracking-wider text-neutral-400 uppercase"
            >
              {{ group.name }}
            </p>
            @for (r of group.items; track r.group + r.id) {
              <button
                type="button"
                role="option"
                [id]="'gs-' + indexOf(r)"
                [attr.aria-selected]="indexOf(r) === active()"
                class="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left"
                [class.bg-neutral-100]="indexOf(r) === active()"
                (mouseenter)="active.set(indexOf(r))"
                (click)="go(r)"
              >
                <span
                  class="grid size-7 shrink-0 place-items-center rounded-md border border-line bg-white text-ink"
                >
                  <svg [lucideIcon]="r.icon" size="14" strokeWidth="1.75" />
                </span>
                <span class="min-w-0">
                  <span class="block truncate text-[13px] font-medium text-ink">{{ r.title }}</span>
                  <span class="block truncate text-xs text-muted">{{ r.subtitle }}</span>
                </span>
              </button>
            }
          }
        }
      </div>
    }
  `,
})
export class GlobalSearch {
  private readonly search = inject(SearchService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected readonly query = signal('');
  protected readonly results = signal<SearchResult[]>([]);
  protected readonly loading = signal(false);
  protected readonly open = signal(false);
  protected readonly active = signal(0);

  protected readonly groups = computed(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of this.results()) map.set(r.group, [...(map.get(r.group) ?? []), r]);
    return [...map.entries()].map(([name, items]) => ({ name, items }));
  });

  constructor() {
    toObservable(this.query)
      .pipe(
        debounceTime(150),
        distinctUntilChanged(),
        switchMap((q) => (q.trim() ? this.search.search(q) : of([]))),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((results) => {
        this.results.set(results);
        this.active.set(0);
        this.loading.set(false);
      });
  }

  protected indexOf(r: SearchResult): number {
    return this.results().indexOf(r);
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.loading.set(value.trim().length > 0);
    this.open.set(value.length > 0);
  }

  protected onKey(event: KeyboardEvent): void {
    const count = this.results().length;
    if (event.key === 'ArrowDown' && count) {
      event.preventDefault();
      this.active.update((i) => (i + 1) % count);
    } else if (event.key === 'ArrowUp' && count) {
      event.preventDefault();
      this.active.update((i) => (i - 1 + count) % count);
    } else if (event.key === 'Enter' && count) {
      event.preventDefault();
      this.go(this.results()[this.active()]);
    } else if (event.key === 'Escape') {
      this.open.set(false);
      this.inputRef().nativeElement.blur();
    }
  }

  protected onGlobalKey(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.inputRef().nativeElement.focus();
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  /** Focus the input (used by the mobile search toggle). */
  focus(): void {
    setTimeout(() => this.inputRef().nativeElement.focus());
  }

  protected go(result: SearchResult): void {
    this.open.set(false);
    this.query.set('');
    void this.router.navigateByUrl(result.route);
  }
}
