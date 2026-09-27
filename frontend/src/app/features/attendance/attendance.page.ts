import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageHeader } from '../../shared/ui/page-header';
import { TabLink, TabNav } from '../../shared/ui/tab-nav';

@Component({
  selector: 'app-attendance-page',
  imports: [RouterOutlet, PageHeader, TabNav],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header
      title="Attendance"
      subtitle="Mark daily attendance, review monthly registers and staff presence."
    />
    <app-tab-nav [tabs]="tabs" label="Attendance sections" />
    <router-outlet />
  `,
})
export class AttendancePage {
  protected readonly tabs: TabLink[] = [
    { label: 'Mark attendance', route: 'mark', icon: 'square-check' },
    { label: 'Monthly register', route: 'register', icon: 'table' },
    { label: 'Staff attendance', route: 'staff', icon: 'fingerprint-pattern', roles: ['Admin'] },
  ];
}
