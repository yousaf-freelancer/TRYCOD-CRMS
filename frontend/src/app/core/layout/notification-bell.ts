import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { PopoverModule } from 'primeng/popover';
import { NotificationsService } from '../../features/notifications/data-access/notifications.service';
import { NotificationIcon } from '../../features/notifications/ui/notification-icon';
import { AppNotification } from '../../models';
import { AppDatePipe } from '../../shared/pipes/format.pipes';

@Component({
  selector: 'app-notification-bell',
  imports: [PopoverModule, LucideDynamicIcon, RouterLink, AppDatePipe, NotificationIcon],
  template: `
    <button
      type="button"
      class="btn btn-ghost btn-icon relative"
      [attr.aria-label]="'Notifications, ' + unread() + ' unread'"
      aria-haspopup="dialog"
      (click)="panel.toggle($event)"
    >
      <svg lucideIcon="bell" size="18" strokeWidth="1.75" />
      @if (unread()) {
        <span
          class="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-neutral-950 px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-white"
          >{{ unread() > 9 ? '9+' : unread() }}</span
        >
      }
    </button>
    <p-popover
      #panel
      styleClass="w-[22rem] max-w-[calc(100vw-1.5rem)] [&_.p-popover-content]:!p-0"
      appendTo="body"
    >
      <div>
        <div class="flex items-center justify-between border-b border-line px-4 py-3">
          <p class="text-sm font-semibold">Notifications</p>
          @if (unread()) {
            <button
              type="button"
              class="text-xs font-medium text-muted hover:text-ink"
              (click)="markAll()"
            >
              Mark all read
            </button>
          }
        </div>
        <ul class="max-h-96 divide-y divide-neutral-100 overflow-y-auto">
          @for (n of latest(); track n.id) {
            <li>
              <button
                type="button"
                class="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50"
                (click)="open(n); panel.hide()"
              >
                <app-notification-icon [type]="n.type" />
                <span class="min-w-0 flex-1">
                  <span class="flex items-start justify-between gap-2">
                    <span
                      class="text-[13px] font-medium text-ink"
                      [class.font-semibold]="!n.read"
                      >{{ n.title }}</span
                    >
                    @if (!n.read) {
                      <span
                        class="mt-1.5 size-2 shrink-0 rounded-full bg-neutral-950"
                        aria-label="Unread"
                      ></span>
                    }
                  </span>
                  <span class="mt-0.5 line-clamp-2 block text-xs text-muted">{{ n.message }}</span>
                  <span class="mt-1 block text-[11px] text-neutral-400">{{
                    n.at | appDate: 'ago'
                  }}</span>
                </span>
              </button>
            </li>
          } @empty {
            <li class="px-4 py-10 text-center text-sm text-muted">You're all caught up.</li>
          }
        </ul>
        <div class="border-t border-line p-2">
          <a [routerLink]="allRoute()" class="btn btn-ghost btn-sm w-full" (click)="panel.hide()"
            >View all notifications</a
          >
        </div>
      </div>
    </p-popover>
  `,
})
export class NotificationBell {
  private readonly notifications = inject(NotificationsService);
  private readonly router = inject(Router);
  readonly allRoute = input('/notifications');

  protected readonly unread = this.notifications.unreadCount;
  protected readonly latest = computed(() => this.notifications.items().slice(0, 6));

  constructor() {
    this.notifications.getNotifications().subscribe();
  }

  protected markAll(): void {
    this.notifications.markAllRead().subscribe();
  }

  protected open(n: AppNotification): void {
    this.notifications.markRead(n.id).subscribe();
    if (n.link) void this.router.navigateByUrl(n.link);
  }
}
