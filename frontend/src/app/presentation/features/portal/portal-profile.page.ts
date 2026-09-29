import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../../core/auth/auth.service';
import { formatDate } from '../../../shared/utils/date.util';
import { Avatar } from '../../../shared/ui/avatar';
import { DetailItem, DetailList } from '../../../shared/ui/detail-list';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { StudentsService } from '../../../data/services/students.service';

@Component({
  selector: 'app-portal-profile-page',
  imports: [SkeletonModule, PageHeader, Avatar, StatusBadge, DetailList, EmptyState],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header
      title="My profile"
      subtitle="Contact the front office to update any of these details."
    />
    @if (student.value(); as s) {
      <div class="card card-pad flex flex-col gap-4 sm:flex-row sm:items-center">
        <app-avatar [name]="s.name" size="xl" />
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-lg font-semibold">{{ s.name }}</h2>
            <app-status-badge [status]="s.status" />
          </div>
          <p class="text-[13px] text-muted">
            <span class="mono">{{ s.id }}</span> · {{ s.courseName }} · {{ s.batchCode }}
          </p>
        </div>
      </div>
      <div class="mt-4 grid gap-4 lg:grid-cols-2">
        <section class="card card-pad">
          <h3 class="section-title mb-4">Personal</h3>
          <app-detail-list [items]="personal()" />
        </section>
        <section class="card card-pad">
          <h3 class="section-title mb-4">Course</h3>
          <app-detail-list [items]="course()" />
        </section>
        <section class="card card-pad lg:col-span-2">
          <h3 class="section-title mb-4">Guardian</h3>
          <app-detail-list [columns]="3" [items]="guardian()" />
        </section>
      </div>
    } @else if (student.isLoading()) {
      <div class="card card-pad"><p-skeleton height="6rem" /></div>
    } @else {
      <div class="card"><app-empty-state icon="user-x" title="Profile not found" /></div>
    }
  `,
})
export class PortalProfilePage {
  private readonly service = inject(StudentsService);
  private readonly auth = inject(AuthService);
  protected readonly student = rxResource({
    params: () => this.auth.user()?.studentId ?? '',
    stream: ({ params }) => this.service.getStudent(params),
  });
  private readonly s = computed(() => (this.student.hasValue() ? this.student.value() : null));

  protected readonly personal = computed<DetailItem[]>(() => {
    const s = this.s();
    return s
      ? [
          { label: 'Email', value: s.email },
          { label: 'Phone', value: s.phone },
          { label: 'Date of birth', value: formatDate(s.dob) },
          { label: 'Qualification', value: s.qualification },
          { label: 'Address', value: `${s.address}, ${s.city}` },
        ]
      : [];
  });
  protected readonly course = computed<DetailItem[]>(() => {
    const s = this.s();
    return s
      ? [
          { label: 'Course', value: s.courseName },
          { label: 'Batch', value: s.batchCode, mono: true },
          { label: 'Mentor', value: s.mentorName },
          { label: 'Admission date', value: formatDate(s.admissionDate) },
        ]
      : [];
  });
  protected readonly guardian = computed<DetailItem[]>(() => {
    const s = this.s();
    return s
      ? [
          { label: 'Name', value: s.guardian.name },
          { label: 'Relation', value: s.guardian.relation },
          { label: 'Phone', value: s.guardian.phone },
        ]
      : [];
  });
}
