import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageHeader } from '../../shared/ui/page-header';
import { TabLink, TabNav } from '../../shared/ui/tab-nav';

@Component({
  selector: 'app-reports-page',
  imports: [RouterOutlet, PageHeader, TabNav],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header title="Reports" subtitle="Filter, analyse and export institute data." />
    <app-tab-nav [tabs]="tabs" label="Report types" />
    <router-outlet />
  `,
})
export class ReportsPage {
  protected readonly tabs: TabLink[] = [
    { label: 'Admissions', route: 'admissions' },
    { label: 'Fee collection', route: 'fee-collection' },
    { label: 'Pending fees', route: 'pending-fees' },
    { label: 'Student attendance', route: 'student-attendance' },
    { label: 'Staff attendance', route: 'staff-attendance' },
    { label: 'Payroll', route: 'payroll' },
    { label: 'Sales calls', route: 'sales-calls' },
    { label: 'Mentor reports', route: 'mentor-reports' },
  ];
}
