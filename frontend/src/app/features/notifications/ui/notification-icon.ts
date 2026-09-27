import { Component, computed, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { NotificationType } from '../../../models';

const ICONS: Record<NotificationType, { icon: string; cls: string }> = {
  fee_due: { icon: 'receipt-indian-rupee', cls: 'bg-[var(--tc-warn-bg)] text-[var(--tc-warn-fg)]' },
  fee_received: {
    icon: 'indian-rupee',
    cls: 'bg-[var(--tc-success-bg)] text-[var(--tc-success-fg)]',
  },
  follow_up_due: {
    icon: 'phone-forwarded',
    cls: 'bg-[var(--tc-info-bg)] text-[var(--tc-info-fg)]',
  },
  follow_up_overdue: {
    icon: 'alarm-clock',
    cls: 'bg-[var(--tc-danger-bg)] text-[var(--tc-danger-fg)]',
  },
  new_admission: { icon: 'user-check', cls: 'bg-neutral-950 text-white' },
  leave_request: { icon: 'plane', cls: 'bg-neutral-100 text-neutral-800' },
  attendance_alert: {
    icon: 'calendar-x',
    cls: 'bg-[var(--tc-danger-bg)] text-[var(--tc-danger-fg)]',
  },
  system: { icon: 'info', cls: 'bg-neutral-100 text-neutral-800' },
};

@Component({
  selector: 'app-notification-icon',
  imports: [LucideDynamicIcon],
  host: { class: 'inline-flex shrink-0' },
  template: `
    <span class="grid size-8 place-items-center rounded-lg" [class]="meta().cls">
      <svg [lucideIcon]="meta().icon" size="15" strokeWidth="1.75" />
    </span>
  `,
})
export class NotificationIcon {
  readonly type = input.required<NotificationType>();
  protected readonly meta = computed(() => ICONS[this.type()]);
}
