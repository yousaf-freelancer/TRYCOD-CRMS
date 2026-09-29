import { Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../domain/models';

export interface TabLink {
  label: string;
  route: string;
  icon?: string;
  roles?: readonly Role[];
  exact?: boolean;
  badge?: number | null;
}

/** Router-driven tab strip (each tab is its own lazy-loaded route). */
@Component({
  selector: 'app-tab-nav',
  imports: [RouterLink, RouterLinkActive, LucideDynamicIcon],
  host: { class: 'block' },
  template: `
    <nav class="-mx-1 mb-6 overflow-x-auto border-b border-line" [attr.aria-label]="label()">
      <ul class="flex min-w-max gap-1 px-1">
        @for (tab of visibleTabs(); track tab.route) {
          <li>
            <a
              [routerLink]="tab.route"
              routerLinkActive="!border-neutral-950 !text-ink"
              [routerLinkActiveOptions]="{ exact: tab.exact ?? false }"
              class="-mb-px flex items-center gap-2 border-b-2 border-transparent px-3 py-2.5 text-[13.5px] font-medium text-muted transition-colors hover:text-ink"
            >
              @if (tab.icon) {
                <svg [lucideIcon]="tab.icon" size="15" strokeWidth="1.75" />
              }
              {{ tab.label }}
              @if (tab.badge) {
                <span
                  class="rounded-full bg-neutral-950 px-1.5 text-[10.5px] leading-4 font-semibold text-white"
                  >{{ tab.badge }}</span
                >
              }
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class TabNav {
  private readonly auth = inject(AuthService);
  readonly tabs = input.required<TabLink[]>();
  readonly label = input('Section navigation');

  protected readonly visibleTabs = computed(() => {
    const role = this.auth.role();
    return this.tabs().filter((t) => !t.roles || (role !== null && t.roles.includes(role)));
  });
}
