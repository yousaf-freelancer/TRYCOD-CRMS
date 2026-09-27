import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { Logo } from '../../shared/ui/logo';
import { PORTAL_NAV } from '../navigation/nav.config';
import { PageTitleStrategy } from '../navigation/page-title.strategy';
import { NotificationBell } from './notification-bell';
import { UserMenu } from './user-menu';

/** Lighter layout for the student portal: top bar + tab navigation. */
@Component({
  selector: 'app-portal-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideDynamicIcon,
    Logo,
    NotificationBell,
    UserMenu,
  ],
  template: `
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-neutral-950 focus:px-3 focus:py-2 focus:text-white"
    >
      Skip to content
    </a>
    <div class="min-h-dvh bg-canvas">
      <header class="no-print sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-md">
        <div
          class="mx-auto flex h-[var(--tc-header-height)] max-w-6xl items-center gap-4 px-4 sm:px-6"
        >
          <a routerLink="/portal" aria-label="Student portal home" class="flex items-center gap-3">
            <app-logo [height]="24" />
            <span
              class="hidden rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-muted sm:inline"
              >Student Portal</span
            >
          </a>
          <span class="flex-1"></span>
          <app-notification-bell allRoute="/portal/notifications" />
          <div class="h-6 w-px bg-line" aria-hidden="true"></div>
          <app-user-menu [portal]="true" />
        </div>
        <nav class="mx-auto max-w-6xl overflow-x-auto px-2 sm:px-4" aria-label="Portal navigation">
          <ul class="flex min-w-max gap-1">
            @for (item of nav; track item.route) {
              <li>
                <a
                  [routerLink]="item.route"
                  routerLinkActive="!border-neutral-950 !text-ink"
                  [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                  class="-mb-px flex items-center gap-2 border-b-2 border-transparent px-3 py-2.5 text-[13.5px] font-medium text-muted transition-colors hover:text-ink"
                >
                  <svg [lucideIcon]="item.icon" size="15" strokeWidth="1.75" />
                  {{ item.label }}
                </a>
              </li>
            }
          </ul>
        </nav>
      </header>
      <main
        id="main"
        tabindex="-1"
        class="mx-auto max-w-6xl px-4 py-6 outline-none sm:px-6 lg:py-8 print:!p-0"
        [attr.aria-label]="context().title"
      >
        <router-outlet />
      </main>
      <footer class="no-print mx-auto max-w-6xl px-4 pb-8 text-xs text-muted sm:px-6">
        © 2026 Trycod Tech School
      </footer>
    </div>
  `,
})
export class PortalShell {
  protected readonly nav = PORTAL_NAV;
  protected readonly context = inject(PageTitleStrategy).context;
}
