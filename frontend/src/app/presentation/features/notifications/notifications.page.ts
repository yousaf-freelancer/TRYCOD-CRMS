import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { AppNotification, NOTIFICATION_TYPE_LABELS, NotificationType } from '../../../domain/models';
import { AppDatePipe } from '../../../shared/pipes/format.pipes';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { NotificationsService } from '../../../data/services/notifications.service';
import { NotificationIcon } from './ui/notification-icon';

@Component({
  selector: 'app-notifications-page',
  imports: [
    FormsModule,
    LucideDynamicIcon,
    SelectModule,
    SelectButtonModule,
    SkeletonModule,
    PageHeader,
    EmptyState,
    NotificationIcon,
    AppDatePipe,
  ],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header
      title="Notifications"
      [subtitle]="unread() ? unread() + ' unread' : 'You’re all caught up.'"
    >
      <button type="button" class="btn btn-secondary" (click)="markAll()" [disabled]="!unread()">
        <svg lucideIcon="check-check" size="15" /> Mark all read
      </button>
    </app-page-header>

    <div class="card overflow-hidden">
      <div class="table-toolbar">
        <p-selectbutton
          [options]="readOptions"
          optionLabel="label"
          optionValue="value"
          [(ngModel)]="readFilter"
          [allowEmpty]="false"
          size="small"
          ariaLabelledBy="nf-read"
        />
        <span id="nf-read" class="sr-only">Read status</span>
        <p-select
          [options]="typeOptions()"
          optionLabel="label"
          optionValue="value"
          [(ngModel)]="type"
          placeholder="All types"
          [showClear]="true"
          class="!w-52"
          ariaLabel="Filter by type"
        />
      </div>
      @if (load.isLoading() && !items().length) {
        <div class="space-y-3 p-5">
          @for (i of [1, 2, 3, 4]; track i) {
            <p-skeleton height="3.5rem" />
          }
        </div>
      } @else if (load.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load notifications"
          actionLabel="Retry"
          (action)="load.reload()"
        />
      } @else {
        <ul class="divide-y divide-neutral-100">
          @for (n of filtered(); track n.id) {
            <li>
              <button
                type="button"
                class="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-neutral-50"
                [class.bg-neutral-50]="!n.read"
                (click)="open(n)"
              >
                <app-notification-icon [type]="n.type" />
                <span class="min-w-0 flex-1">
                  <span class="flex flex-wrap items-center gap-2">
                    <span
                      class="text-[13.5px] text-ink"
                      [class.font-semibold]="!n.read"
                      [class.font-medium]="n.read"
                      >{{ n.title }}</span
                    >
                    <span
                      class="rounded-full border border-line px-2 py-px text-[11px] text-muted"
                      >{{ labels[n.type] }}</span
                    >
                  </span>
                  <span class="mt-0.5 block text-[13px] text-ink-secondary">{{ n.message }}</span>
                  <span class="mt-1 block text-xs text-muted"
                    >{{ n.at | appDate: 'ago' }} · {{ n.at | appDate: 'datetime' }}</span
                  >
                </span>
                @if (!n.read) {
                  <span
                    class="mt-2 size-2 shrink-0 rounded-full bg-neutral-950"
                    aria-label="Unread"
                  ></span>
                } @else if (n.link) {
                  <svg
                    lucideIcon="chevron-right"
                    size="16"
                    class="mt-2 shrink-0 text-neutral-300"
                  />
                }
              </button>
            </li>
          } @empty {
            <li>
              <app-empty-state
                icon="bell-off"
                title="No notifications here"
                message="Try a different filter."
              />
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class NotificationsPage {
  private readonly service = inject(NotificationsService);
  private readonly router = inject(Router);

  protected readonly labels = NOTIFICATION_TYPE_LABELS;
  protected readonly readOptions = [
    { label: 'All', value: 'all' },
    { label: 'Unread', value: 'unread' },
    { label: 'Read', value: 'read' },
  ];
  protected readonly readFilter = signal<'all' | 'unread' | 'read'>('all');
  protected readonly type = signal<NotificationType | null>(null);

  protected readonly load = rxResource({ stream: () => this.service.getNotifications() });
  protected readonly items = this.service.items;
  protected readonly unread = this.service.unreadCount;
  protected readonly typeOptions = computed(() =>
    [...new Set(this.items().map((n) => n.type))].map((t) => ({
      label: NOTIFICATION_TYPE_LABELS[t],
      value: t,
    })),
  );
  protected readonly filtered = computed(() =>
    this.items().filter(
      (n) =>
        (this.readFilter() === 'all' || (this.readFilter() === 'unread' ? !n.read : n.read)) &&
        (!this.type() || n.type === this.type()),
    ),
  );

  protected markAll(): void {
    this.service.markAllRead().subscribe();
  }

  protected open(n: AppNotification): void {
    this.service.markRead(n.id).subscribe();
    if (n.link) void this.router.navigateByUrl(n.link);
  }
}
