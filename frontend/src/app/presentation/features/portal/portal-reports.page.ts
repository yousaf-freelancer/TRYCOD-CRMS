import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../../core/auth/auth.service';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { MentorReportsService } from '../../../data/services/mentor-reports.service';
import { ReportTimeline } from '../mentor-reports/ui/report-timeline';

@Component({
  selector: 'app-portal-reports-page',
  imports: [SkeletonModule, PageHeader, EmptyState, ReportTimeline],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header title="Mentor reports" subtitle="Weekly feedback from your mentor." />
    @if (reports.error()) {
      <div class="card">
        <app-empty-state
          variant="error"
          title="Couldn't load reports"
          actionLabel="Retry"
          (action)="reports.reload()"
        />
      </div>
    } @else if (reports.isLoading()) {
      <div class="space-y-3">
        <div class="card card-pad"><p-skeleton height="8rem" /></div>
        <div class="card card-pad"><p-skeleton height="8rem" /></div>
      </div>
    } @else if (reports.value().length) {
      <app-report-timeline [reports]="reports.value()" />
    } @else {
      <div class="card">
        <app-empty-state
          icon="clipboard-list"
          title="No reports yet"
          message="Reports are published every week by your mentor."
        />
      </div>
    }
  `,
})
export class PortalReportsPage {
  private readonly service = inject(MentorReportsService);
  private readonly auth = inject(AuthService);
  protected readonly reports = rxResource({
    params: () => this.auth.user()?.studentId ?? '',
    stream: ({ params }) => this.service.getReports({ studentId: params }),
    defaultValue: [],
  });
}
