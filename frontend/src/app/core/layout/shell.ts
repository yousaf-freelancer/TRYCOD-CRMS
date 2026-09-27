import { Component, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DrawerModule } from 'primeng/drawer';
import { filter } from 'rxjs';
import { Header } from './header';
import { Sidebar } from './sidebar';

const COLLAPSE_KEY = 'trycod.sidebar.collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Staff application shell: sidebar (drawer on mobile) + header + content. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, DrawerModule, Header, Sidebar],
  template: `
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-neutral-950 focus:px-3 focus:py-2 focus:text-white"
    >
      Skip to content
    </a>
    <div class="min-h-dvh bg-canvas">
      <aside
        class="no-print fixed inset-y-0 left-0 z-30 hidden bg-neutral-950 transition-[width] duration-200 ease-out lg:block"
        [style.width]="collapsed() ? 'var(--tc-sidebar-collapsed)' : 'var(--tc-sidebar-width)'"
      >
        <app-sidebar [collapsed]="collapsed()" (toggleCollapse)="collapsed.set(!collapsed())" />
      </aside>

      <p-drawer
        [(visible)]="mobileOpen"
        position="left"
        [showCloseIcon]="false"
        styleClass="app-nav-drawer !w-72 lg:!hidden [&_.p-drawer-content]:!p-0 [&_.p-drawer-header]:!hidden"
        ariaCloseLabel="Close navigation"
      >
        <app-sidebar [showCollapse]="false" (navigate)="mobileOpen.set(false)" />
      </p-drawer>

      <div
        class="transition-[padding] duration-200 ease-out print:!pl-0"
        [class]="
          collapsed() ? 'lg:pl-[var(--tc-sidebar-collapsed)]' : 'lg:pl-[var(--tc-sidebar-width)]'
        "
      >
        <app-header class="no-print" (menuToggle)="mobileOpen.set(true)" />
        <main
          id="main"
          tabindex="-1"
          class="mx-auto w-full max-w-[1480px] px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8 print:!p-0"
        >
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class Shell {
  protected readonly collapsed = signal(readCollapsed());
  protected readonly mobileOpen = signal(false);

  constructor() {
    effect(() => {
      const value = this.collapsed() ? '1' : '0';
      try {
        localStorage.setItem(COLLAPSE_KEY, value);
      } catch {
        /* storage unavailable — keep in memory only */
      }
    });
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.mobileOpen.set(false));
  }
}
