import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageHeader } from '../../shared/ui/page-header';
import { TabLink, TabNav } from '../../shared/ui/tab-nav';

@Component({
  selector: 'app-admissions-page',
  imports: [RouterOutlet, PageHeader, TabNav],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header
      title="Admissions"
      subtitle="Leads, enquiries, follow-ups and confirmed admissions in one place."
    />
    <app-tab-nav [tabs]="tabs" label="Admissions sections" />
    <router-outlet />
  `,
})
export class AdmissionsPage {
  protected readonly tabs: TabLink[] = [
    { label: 'Leads', route: 'leads', icon: 'user-plus' },
    { label: 'Enquiries', route: 'enquiries', icon: 'messages-square' },
    { label: 'Follow-ups', route: 'follow-ups', icon: 'phone-forwarded' },
    { label: 'Admissions', route: 'admissions', icon: 'user-check', roles: ['Admin', 'Advisor'] },
  ];
}
