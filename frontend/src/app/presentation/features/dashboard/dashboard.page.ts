import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { AdminDashboardView } from './views/admin-dashboard';
import { AdvisorDashboardView } from './views/advisor-dashboard';
import { MentorDashboardView } from './views/mentor-dashboard';
import { SalesDashboardView } from './views/sales-dashboard';

/** Picks the dashboard for the signed-in role. */
@Component({
  selector: 'app-dashboard-page',
  imports: [AdminDashboardView, AdvisorDashboardView, MentorDashboardView, SalesDashboardView],
  host: { class: 'block page-enter' },
  template: `
    @switch (role()) {
      @case ('Admin') {
        <app-admin-dashboard />
      }
      @case ('Advisor') {
        <app-advisor-dashboard />
      }
      @case ('Mentor') {
        <app-mentor-dashboard />
      }
      @case ('Sales') {
        <app-sales-dashboard />
      }
    }
  `,
})
export class DashboardPage {
  protected readonly role = inject(AuthService).role;
}
