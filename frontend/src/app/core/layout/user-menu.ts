import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { Avatar } from '../../shared/ui/avatar';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-user-menu',
  imports: [MenuModule, Avatar, LucideDynamicIcon],
  template: `
    @if (user(); as u) {
      <button
        type="button"
        class="flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1 transition-colors hover:bg-neutral-100"
        aria-haspopup="menu"
        [attr.aria-label]="'Account menu for ' + u.name"
        (click)="menu.toggle($event)"
      >
        <app-avatar [name]="u.name" size="sm" />
        <span class="hidden text-left md:block">
          <span class="block text-[13px] leading-4 font-medium text-ink">{{ u.name }}</span>
          <span class="block text-[11.5px] leading-4 text-muted">{{ u.role }}</span>
        </span>
        <svg lucideIcon="chevron-down" size="14" class="hidden text-muted md:block" />
      </button>
      <p-menu #menu [model]="items()" [popup]="true" appendTo="body" styleClass="min-w-52">
        <ng-template #start>
          <div class="border-b border-line px-3 py-2.5">
            <p class="text-[13px] font-medium text-ink">{{ u.name }}</p>
            <p class="truncate text-xs text-muted">{{ u.email }}</p>
          </div>
        </ng-template>
        <ng-template #item let-item>
          <span class="flex items-center gap-2.5 px-2.5 py-1.5 text-[13px]">
            <svg [lucideIcon]="item.icon" size="15" strokeWidth="1.75" />
            {{ item.label }}
          </span>
        </ng-template>
      </p-menu>
    }
  `,
})
export class UserMenu {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  /** Portal users get portal routes. */
  readonly portal = input(false);

  protected readonly user = this.auth.user;
  protected readonly items = computed<MenuItem[]>(() => {
    const profileRoute = this.portal() ? '/portal/profile' : '/settings/account';
    const items: MenuItem[] = [{ label: 'My profile', icon: 'user', routerLink: profileRoute }];
    if (!this.portal())
      items.push({ label: 'Settings', icon: 'settings', routerLink: '/settings' });
    items.push(
      { separator: true },
      { label: 'Sign out', icon: 'log-out', command: () => this.logout() },
    );
    return items;
  });

  private logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
