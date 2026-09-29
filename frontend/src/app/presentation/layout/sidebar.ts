import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { TooltipModule } from 'primeng/tooltip';
import { Avatar } from '../../shared/ui/avatar';
import { Logo } from '../../shared/ui/logo';
import { AuthService } from '../../core/auth/auth.service';
import { navForRole } from '../../core/navigation/nav.config';

/**
 * Dark (brand black) sidebar. Each nav item has a colour-coded icon so
 * sections are easy to scan; the active item gets a white pill.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LucideDynamicIcon, TooltipModule, Logo, Avatar],
  host: { class: 'flex h-full flex-col bg-neutral-950 text-neutral-300' },
  template: `
    <div
      class="flex h-[var(--tc-header-height)] shrink-0 items-center border-b border-white/10"
      [class]="collapsed() ? 'justify-center px-2' : 'px-4'"
    >
      <a
        routerLink="/dashboard"
        class="flex items-center gap-2.5 rounded-lg focus-visible:outline-white"
        aria-label="Trycod Tech School — Dashboard"
        (click)="navigate.emit()"
      >
        <!-- Logo sits on a white tile so it is never recoloured on the dark background. -->
        <span
          class="inline-flex items-center overflow-hidden rounded-lg bg-white"
          [class]="collapsed() ? 'max-w-10 px-1.5 py-1.5' : 'px-2.5 py-1.5'"
        >
          <app-logo [height]="collapsed() ? 20 : 22" />
        </span>
        @if (!collapsed()) {
          <span class="text-[11px] leading-tight font-medium text-neutral-400">Tech<br />School</span>
        }
      </a>
    </div>

    <nav class="sidebar-scroll flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
      @for (section of sections(); track section.label; let first = $first) {
        <div [class.mt-6]="!first">
          @if (collapsed()) {
            @if (!first) {
              <div class="mx-2 mb-3 border-t border-white/10"></div>
            }
          } @else {
            <p class="mb-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
              {{ section.label }}
            </p>
          }
          <ul class="space-y-1">
            @for (item of section.items; track item.route) {
              <li>
                <a
                  [routerLink]="item.route"
                  routerLinkActive="is-active"
                  [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                  #rla="routerLinkActive"
                  [attr.aria-current]="rla.isActive ? 'page' : null"
                  [pTooltip]="item.label"
                  [tooltipDisabled]="!collapsed()"
                  tooltipPosition="right"
                  class="nav-link group relative flex h-10 items-center gap-3 rounded-lg text-[14px] font-medium text-neutral-300 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-white"
                  [class]="collapsed() ? 'justify-center px-0' : 'px-3'"
                  [attr.aria-label]="collapsed() ? item.label : null"
                  (click)="navigate.emit()"
                >
                  <span
                    class="nav-icon grid size-7 shrink-0 place-items-center rounded-md bg-white/[0.06] transition-colors"
                    [class]="item.accent ?? 'text-neutral-300'"
                  >
                    <svg [lucideIcon]="item.icon" size="16" strokeWidth="2" />
                  </span>
                  @if (!collapsed()) {
                    <span class="truncate">{{ item.label }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        </div>
      }
    </nav>

    <div class="shrink-0 border-t border-white/10 p-3">
      @if (user(); as u) {
        <a
          routerLink="/settings/account"
          class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.07] focus-visible:outline-white"
          [class.justify-center]="collapsed()"
          [pTooltip]="u.name"
          [tooltipDisabled]="!collapsed()"
          tooltipPosition="right"
          (click)="navigate.emit()"
        >
          <app-avatar [name]="u.name" size="sm" />
          @if (!collapsed()) {
            <span class="min-w-0">
              <span class="block truncate text-[13px] font-semibold text-white">{{ u.name }}</span>
              <span class="block truncate text-xs text-neutral-400">{{ u.role }} · {{ u.title }}</span>
            </span>
          }
        </a>
      }
      @if (showCollapse()) {
        <button
          type="button"
          class="mt-1 flex h-9 w-full items-center gap-2 rounded-lg px-3 text-[13px] font-medium text-neutral-400 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-white"
          [class.justify-center]="collapsed()"
          (click)="toggleCollapse.emit()"
          [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          [attr.aria-expanded]="!collapsed()"
        >
          <svg [lucideIcon]="collapsed() ? 'panel-left-open' : 'panel-left-close'" size="16" strokeWidth="1.75" />
          @if (!collapsed()) {
            <span>Collapse</span>
          }
        </button>
      }
    </div>
  `,
})
export class Sidebar {
  private readonly auth = inject(AuthService);
  readonly collapsed = input(false);
  readonly showCollapse = input(true);
  readonly toggleCollapse = output<void>();
  /** Emitted on link click (closes the mobile drawer). */
  readonly navigate = output<void>();

  protected readonly user = this.auth.user;
  protected readonly sections = computed(() => navForRole(this.auth.role()));
}
