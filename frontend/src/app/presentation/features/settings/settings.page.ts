import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { PageHeader } from '../../../shared/ui/page-header';

const SECTIONS = [
  { label: 'Institute profile', route: 'institute', icon: 'building', admin: true },
  { label: 'Academic year', route: 'academic-year', icon: 'calendar-range', admin: true },
  { label: 'Fee settings', route: 'fees', icon: 'wallet', admin: true },
  { label: 'Attendance rules', route: 'attendance', icon: 'clock', admin: true },
  { label: 'Leave types', route: 'leave-types', icon: 'plane', admin: true },
  { label: 'Roles & permissions', route: 'roles', icon: 'shield-check', admin: true },
  { label: 'Notifications', route: 'notifications', icon: 'bell', admin: true },
  { label: 'My account', route: 'account', icon: 'circle-user', admin: false },
];

@Component({
  selector: 'app-settings-page',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideDynamicIcon, PageHeader],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header
      title="Settings"
      [subtitle]="
        isAdmin() ? 'Institute configuration and your account.' : 'Your account and preferences.'
      "
    />
    <div class="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Settings sections" class="-mx-1 overflow-x-auto lg:mx-0 lg:overflow-visible">
        <ul class="flex min-w-max gap-1 px-1 lg:min-w-0 lg:flex-col lg:px-0">
          @for (s of sections(); track s.route) {
            <li>
              <a
                [routerLink]="s.route"
                routerLinkActive="!bg-white !text-ink shadow-card !border-line"
                class="flex items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-[13.5px] font-medium whitespace-nowrap text-ink-secondary transition-colors hover:text-ink"
              >
                <svg [lucideIcon]="s.icon" size="16" strokeWidth="1.75" /> {{ s.label }}
              </a>
            </li>
          }
        </ul>
      </nav>
      <div class="min-w-0"><router-outlet /></div>
    </div>
  `,
})
export class SettingsPage {
  private readonly auth = inject(AuthService);
  protected readonly isAdmin = computed(() => this.auth.role() === 'Admin');
  protected readonly sections = computed(() => SECTIONS.filter((s) => this.isAdmin() || !s.admin));
}
