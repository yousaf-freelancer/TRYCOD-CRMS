import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { PageHeader } from '../../shared/ui/page-header';
import { StudentAttendancePanel } from '../attendance/ui/student-attendance-panel';

@Component({
  selector: 'app-portal-attendance-page',
  imports: [PageHeader, StudentAttendancePanel],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header
      title="My attendance"
      subtitle="Maintain at least 75% attendance to be eligible for certification."
    />
    @if (studentId(); as id) {
      <app-student-attendance-panel [studentId]="id" />
    }
  `,
})
export class PortalAttendancePage {
  private readonly auth = inject(AuthService);
  protected readonly studentId = computed(() => this.auth.user()?.studentId ?? null);
}
