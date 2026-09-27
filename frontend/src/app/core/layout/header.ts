import { Component, inject, output, signal, viewChild } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { PageTitleStrategy } from '../navigation/page-title.strategy';
import { GlobalSearch } from './global-search';
import { NotificationBell } from './notification-bell';
import { UserMenu } from './user-menu';

@Component({
  selector: 'app-header',
  imports: [LucideDynamicIcon, GlobalSearch, NotificationBell, UserMenu],
  host: { class: 'sticky top-0 z-20 block border-b border-line bg-white/85 backdrop-blur-md' },
  template: `
    <div class="flex h-[var(--tc-header-height)] items-center gap-3 px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        class="btn btn-ghost btn-icon -ml-2 lg:hidden"
        aria-label="Open navigation"
        (click)="menuToggle.emit()"
      >
        <svg lucideIcon="menu" size="18" />
      </button>

      <nav aria-label="Breadcrumb" class="min-w-0 flex-1">
        <ol class="flex items-center gap-1.5 text-[13.5px]">
          @if (context().section; as section) {
            <li class="hidden truncate text-muted sm:block">{{ section }}</li>
            <li class="hidden text-neutral-300 sm:block" aria-hidden="true">/</li>
          }
          <li class="truncate font-medium text-ink" aria-current="page">{{ context().title }}</li>
        </ol>
      </nav>

      <div class="hidden w-full max-w-xs md:block lg:max-w-sm">
        <app-global-search />
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-icon md:hidden"
        aria-label="Search"
        [attr.aria-expanded]="mobileSearch()"
        (click)="toggleMobileSearch()"
      >
        <svg lucideIcon="search" size="18" />
      </button>
      <app-notification-bell />
      <div class="h-6 w-px bg-line" aria-hidden="true"></div>
      <app-user-menu />
    </div>
    @if (mobileSearch()) {
      <div class="border-t border-line px-4 py-3 md:hidden">
        <app-global-search #mobileSearchBox />
      </div>
    }
  `,
})
export class Header {
  readonly menuToggle = output<void>();
  protected readonly context = inject(PageTitleStrategy).context;
  protected readonly mobileSearch = signal(false);
  private readonly mobileSearchBox = viewChild<GlobalSearch>('mobileSearchBox');

  protected toggleMobileSearch(): void {
    this.mobileSearch.update((v) => !v);
    setTimeout(() => this.mobileSearchBox()?.focus());
  }
}
