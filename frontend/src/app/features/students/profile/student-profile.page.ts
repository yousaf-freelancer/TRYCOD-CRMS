import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';
import { AuthService } from '../../../core/auth/auth.service';
import { InrPipe } from '../../../shared/pipes/format.pipes';
import { formatDate } from '../../../shared/utils/date.util';
import { Avatar } from '../../../shared/ui/avatar';
import { DetailItem, DetailList } from '../../../shared/ui/detail-list';
import { EmptyState } from '../../../shared/ui/empty-state';
import { Meter } from '../../../shared/ui/meter';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { StudentAttendancePanel } from '../../attendance/ui/student-attendance-panel';
import { CoursesService } from '../../courses/data-access/courses.service';
import { FeesService } from '../../fees/data-access/fees.service';
import { FeeAccountView } from '../../fees/ui/fee-account-view';
import { MentorReportsService } from '../../mentor-reports/data-access/mentor-reports.service';
import { ReportTimeline } from '../../mentor-reports/ui/report-timeline';
import { StudentsService } from '../data-access/students.service';
import { StudentFormDialog } from '../student-form-dialog';
import { StudentDocuments } from './student-documents';

@Component({
  selector: 'app-student-profile-page',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    TabsModule,
    SkeletonModule,
    Avatar,
    StatusBadge,
    DetailList,
    Meter,
    EmptyState,
    StudentAttendancePanel,
    FeeAccountView,
    ReportTimeline,
    StudentDocuments,
    StudentFormDialog,
    InrPipe,
  ],
  host: { class: 'block page-enter' },
  template: `
    <a
      routerLink="/students"
      class="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink"
    >
      <svg lucideIcon="arrow-left" size="14" /> Students
    </a>

    @if (student.error()) {
      <div class="card">
        <app-empty-state
          variant="error"
          title="Couldn't load this student"
          actionLabel="Retry"
          (action)="student.reload()"
        />
      </div>
    } @else if (student.isLoading() && !student.value()) {
      <div class="card card-pad flex items-center gap-4">
        <p-skeleton shape="circle" size="4rem" />
        <div class="space-y-2">
          <p-skeleton width="14rem" height="1.2rem" /><p-skeleton width="9rem" height="0.8rem" />
        </div>
      </div>
    } @else if (student.value(); as s) {
      <header class="card card-pad flex flex-col gap-5 md:flex-row md:items-center">
        <app-avatar [name]="s.name" size="xl" />
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-xl font-semibold tracking-tight">{{ s.name }}</h1>
            <app-status-badge [status]="s.status" />
            <app-status-badge [status]="s.feeStatus" [label]="'Fees: ' + s.feeStatus" />
          </div>
          <p class="mt-1 text-[13px] text-muted">
            <span class="mono">{{ s.id }}</span> · {{ s.courseName }} ·
            <span class="mono">{{ s.batchCode }}</span> · Mentor {{ s.mentorName }}
          </p>
          <div class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-secondary">
            <span class="inline-flex items-center gap-1.5"
              ><svg lucideIcon="phone" size="14" /> {{ s.phone }}</span
            >
            <span class="inline-flex items-center gap-1.5"
              ><svg lucideIcon="mail" size="14" /> {{ s.email }}</span
            >
            <span class="inline-flex items-center gap-1.5"
              ><svg lucideIcon="map-pin" size="14" /> {{ s.city }}</span
            >
          </div>
        </div>
        <div class="grid w-full grid-cols-2 gap-4 md:w-72">
          <div>
            <p class="text-xs text-muted">Attendance</p>
            <p class="text-lg font-semibold tabular-nums">{{ s.attendancePct }}%</p>
            <app-meter [value]="s.attendancePct" [showValue]="false" ariaLabel="Attendance" />
          </div>
          <div>
            <p class="text-xs text-muted">Fee balance</p>
            <p
              class="text-lg font-semibold tabular-nums"
              [class.text-red-700]="s.feeStatus === 'Overdue'"
            >
              {{ s.balance | inr }}
            </p>
          </div>
        </div>
        <div class="flex gap-2 md:flex-col">
          @if (canEdit()) {
            <button type="button" class="btn btn-secondary btn-sm" (click)="editOpen.set(true)">
              <svg lucideIcon="pencil" size="14" /> Edit
            </button>
          }
          @if (canCollect() && s.balance > 0) {
            <a
              [routerLink]="['/fees/collect']"
              [queryParams]="{ student: s.id }"
              class="btn btn-primary btn-sm"
              ><svg lucideIcon="indian-rupee" size="14" /> Collect</a
            >
          }
        </div>
      </header>

      <p-tabs [(value)]="tab" class="mt-6" [lazy]="true" [scrollable]="true">
        <p-tablist>
          <p-tab value="overview">Overview</p-tab>
          <p-tab value="attendance">Attendance</p-tab>
          <p-tab value="fees">Fees</p-tab>
          <p-tab value="reports">Mentor reports</p-tab>
          <p-tab value="documents">Documents</p-tab>
        </p-tablist>
        <p-tabpanels class="!bg-transparent !px-0 !pt-5">
          <p-tabpanel value="overview">
            <div class="grid gap-4 lg:grid-cols-3">
              <section class="card card-pad lg:col-span-2">
                <h2 class="section-title mb-4">Personal details</h2>
                <app-detail-list [items]="personal()" />
              </section>
              <section class="card card-pad">
                <h2 class="section-title mb-4">Guardian</h2>
                <app-detail-list [columns]="1" [items]="guardian()" />
              </section>
              <section class="card card-pad lg:col-span-3">
                <h2 class="section-title mb-4">Course & batch</h2>
                <app-detail-list [columns]="3" [items]="courseDetails()" />
              </section>
            </div>
          </p-tabpanel>
          <p-tabpanel value="attendance">
            <app-student-attendance-panel [studentId]="s.id" />
          </p-tabpanel>
          <p-tabpanel value="fees">
            @if (fees.value(); as account) {
              <app-fee-account-view [account]="account" [showCollect]="canCollect()" />
            } @else if (fees.error()) {
              <div class="card">
                <app-empty-state
                  variant="error"
                  title="Couldn't load fees"
                  actionLabel="Retry"
                  (action)="fees.reload()"
                />
              </div>
            } @else {
              <div class="card card-pad"><p-skeleton height="12rem" /></div>
            }
          </p-tabpanel>
          <p-tabpanel value="reports">
            @if (reports.value().length) {
              <app-report-timeline [reports]="reports.value()" />
            } @else if (!reports.isLoading()) {
              <div class="card">
                <app-empty-state
                  icon="clipboard-list"
                  title="No mentor reports yet"
                  message="Weekly reports appear here once the mentor submits them."
                />
              </div>
            }
          </p-tabpanel>
          <p-tabpanel value="documents">
            <app-student-documents [studentId]="s.id" />
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

      <app-student-form-dialog [(visible)]="editOpen" [student]="s" (saved)="student.reload()" />
    } @else {
      <div class="card">
        <app-empty-state
          icon="user-x"
          title="Student not found"
          message="This student may have been removed."
        />
      </div>
    }
  `,
})
export class StudentProfilePage {
  private readonly studentsService = inject(StudentsService);
  private readonly feesService = inject(FeesService);
  private readonly reportsService = inject(MentorReportsService);
  private readonly coursesService = inject(CoursesService);
  private readonly auth = inject(AuthService);

  /** Route param (component input binding). */
  readonly id = input.required<string>();
  protected readonly tab = signal<string | number | undefined>('overview');
  protected readonly editOpen = signal(false);
  protected readonly canEdit = computed(() => this.auth.hasRole('Admin'));
  protected readonly canCollect = computed(() => this.auth.hasRole('Admin', 'Advisor'));

  protected readonly student = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.studentsService.getStudent(params),
  });
  protected readonly fees = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.feesService.getFeeAccount(params),
  });
  protected readonly reports = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.reportsService.getReports({ studentId: params }),
    defaultValue: [],
  });
  private readonly batches = rxResource({
    stream: () => this.coursesService.getBatches(),
    defaultValue: [],
  });

  private readonly s = computed(() => (this.student.hasValue() ? this.student.value() : null));

  protected readonly personal = computed<DetailItem[]>(() => {
    const s = this.s();
    if (!s) return [];
    return [
      { label: 'Full name', value: s.name },
      { label: 'Gender', value: s.gender },
      { label: 'Date of birth', value: formatDate(s.dob) },
      { label: 'Qualification', value: s.qualification },
      { label: 'Phone', value: s.phone },
      { label: 'Email', value: s.email },
      { label: 'Address', value: `${s.address}, ${s.city}` },
      { label: 'Student ID', value: s.id, mono: true },
    ];
  });

  protected readonly guardian = computed<DetailItem[]>(() => {
    const s = this.s();
    if (!s) return [];
    return [
      { label: 'Name', value: s.guardian.name },
      { label: 'Relation', value: s.guardian.relation },
      { label: 'Phone', value: s.guardian.phone },
      { label: 'Occupation', value: s.guardian.occupation },
    ];
  });

  protected readonly courseDetails = computed<DetailItem[]>(() => {
    const s = this.s();
    if (!s) return [];
    const batch = this.batches.value().find((b) => b.id === s.batchId);
    return [
      { label: 'Course', value: s.courseName },
      { label: 'Batch', value: s.batchCode, mono: true },
      { label: 'Mentor', value: s.mentorName },
      { label: 'Timing', value: batch?.timing },
      { label: 'Mode', value: batch?.mode },
      { label: 'Admission date', value: formatDate(s.admissionDate) },
      { label: 'Batch start', value: formatDate(batch?.startDate) },
      { label: 'Expected completion', value: formatDate(batch?.endDate) },
      { label: 'Batch status', value: batch?.status },
    ];
  });
}
