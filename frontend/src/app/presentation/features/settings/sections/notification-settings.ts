import { Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { NotificationPreference } from '../../../../domain/models';
import { ToastService } from '../../../../shared/ui/toast.service';
import { SettingsService } from '../../../../data/services/settings.service';
import { SettingsSection } from '../ui/settings-section';

type Channel = 'inApp' | 'email' | 'sms';

@Component({
  selector: 'app-notification-settings',
  imports: [FormsModule, ToggleSwitchModule, SettingsSection],
  template: `
    <app-settings-section
      title="Notification preferences"
      description="Choose which events notify staff, and on which channels."
      [saving]="saving()"
      [dirty]="dirty()"
      (save)="save()"
    >
      <div class="-mx-6 overflow-x-auto px-6">
        <table class="w-full min-w-[560px] text-[13px]">
          <thead>
            <tr class="text-left text-xs text-muted">
              <th class="py-2 pr-4 font-medium">Event</th>
              @for (c of channels; track c.key) {
                <th class="w-24 px-2 py-2 text-center font-medium">{{ c.label }}</th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            @for (p of prefs(); track p.event; let i = $index) {
              <tr>
                <th scope="row" class="py-3 pr-4 text-left">
                  <span class="block font-medium">{{ p.event }}</span>
                  <span class="text-xs font-normal text-muted">{{ p.description }}</span>
                </th>
                @for (c of channels; track c.key) {
                  <td class="px-2 py-3 text-center">
                    <p-toggleswitch
                      [ngModel]="p[c.key]"
                      (ngModelChange)="toggle(i, c.key, $event)"
                      [ariaLabel]="p.event + ' via ' + c.label"
                    />
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
      <p class="mt-4 text-xs text-muted">
        Email and SMS delivery will be handled by the backend (e.g. SES / MSG91). In this demo only
        in-app notifications are shown.
      </p>
    </app-settings-section>
  `,
})
export class NotificationSettings {
  private readonly service = inject(SettingsService);
  private readonly toast = inject(ToastService);

  protected readonly channels: { key: Channel; label: string }[] = [
    { key: 'inApp', label: 'In-app' },
    { key: 'email', label: 'Email' },
    { key: 'sms', label: 'SMS' },
  ];
  protected readonly prefs = signal<NotificationPreference[]>([]);
  protected readonly dirty = signal(false);
  protected readonly saving = signal(false);
  private readonly settings = rxResource({ stream: () => this.service.getSettings() });

  constructor() {
    effect(() => {
      const s = this.settings.hasValue() ? this.settings.value() : undefined;
      if (s) this.prefs.set(s.notificationPrefs);
    });
  }

  protected toggle(index: number, channel: Channel, value: boolean): void {
    this.prefs.update((list) => list.map((p, i) => (i === index ? { ...p, [channel]: value } : p)));
    this.dirty.set(true);
  }

  protected save(): void {
    this.saving.set(true);
    this.service.save('notificationPrefs', this.prefs()).subscribe(() => {
      this.saving.set(false);
      this.dirty.set(false);
      this.toast.success('Notification preferences saved');
    });
  }
}
