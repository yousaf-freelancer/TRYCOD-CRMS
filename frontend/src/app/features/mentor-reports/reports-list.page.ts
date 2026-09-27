import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { map } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../core/auth/auth.service';
import { MentorReportView } from '../../models';
import { AppDatePipe } from '../../shared/pipes/format.pipes';
import { downloadCsv } from '../../shared/utils/csv.util';
import { formatDate } from '../../shared/utils/date.util';
import { EmptyState } from '../../shared/ui/empty-state';
import { PageHeader } from '../../shared/ui/page-header';
import { SearchInput } from '../../shared/ui/search-input';
import { TableSkeleton } from '../../shared/ui/table-skeleton';
import { CoursesService } from '../courses/data-access/courses.service';
import { EmployeesService } from '../hr/data-access/employees.service';
import { MentorReportsService } from './data-access/mentor-reports.service';
import { RatingDots } from './ui/rating-dots';
import { ReportTimeline } from './ui/report-timeline';

@Component({
  selector: 'app-mentor-reports-list-page',
  imports: [
    FormsModule,
    RouterLink,
    LucideDynamicIcon,
    DialogModule,
    SelectModule,
    TableModule,
    PageHeader,
    SearchInput,
    EmptyState,
    TableSkeleton,
    RatingDots,
    ReportTimeline,
    AppDatePipe,
  ],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header
      title="Mentor reports"
      subtitle="Weekly progress reports written by mentors for every student."
    >
      <button type="button" class="btn btn-secondary" (click)="exportCsv()">
        <svg lucideIcon="download" size="15" /> Export
      </button>
      <a routerLink="write" class="btn btn-primary"
        ><svg lucideIcon="clipboard-pen" size="15" /> Write reports</a
      >
    </app-page-header>

    @if (pending.value().length) {
      <section
        class="mb-4 rounded-card border border-[var(--tc-warn-border)] bg-[var(--tc-warn-bg)] p-4"
        aria-label="Pending reports"
      >
        <div class="flex items-center gap-2 text-[13px] font-semibold text-[var(--tc-warn-fg)]">
          <svg lucideIcon="clock" size="15" /> {{ pendingTotal() }} reports pending for the week of
          {{ pending.value()[0].weekStart | appDate }}
        </div>
        <ul class="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          @for (p of pending.value(); track p.batchId) {
            <li
              class="flex items-center justify-between gap-3 rounded-lg border border-[var(--tc-warn-border)] bg-white px-3 py-2"
            >
              <div class="min-w-0">
                <p class="mono truncate text-[12.5px] font-medium">{{ p.batchCode }}</p>
                <p class="truncate text-xs text-muted">
                  {{ p.mentorName }} · {{ p.pendingCount }}/{{ p.totalStudents }} pending
                </p>
              </div>
              @if (canWrite(p.mentorId)) {
                <a
                  routerLink="write"
                  [queryParams]="{ batch: p.batchId, week: p.weekStart }"
                  class="btn btn-secondary btn-sm"
                  >Write</a
                >
              }
            </li>
          }
        </ul>
      </section>
    }

    <div class="table-card">
      <div class="table-toolbar">
        <app-search-input class="w-full lg:w-64" [(value)]="search" placeholder="Search student…" />
        <div class="flex flex-wrap items-center gap-2">
          <p-select
            [options]="batchOptions()"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="batchId"
            placeholder="All batches"
            [showClear]="true"
            class="!w-52"
            ariaLabel="Filter by batch"
          />
          @if (isAdmin()) {
            <p-select
              [options]="mentors.value()"
              optionLabel="label"
              optionValue="value"
              [(ngModel)]="mentorId"
              placeholder="All mentors"
              [showClear]="true"
              class="!w-48"
              ariaLabel="Filter by mentor"
            />
          }
          <p-select
            [options]="weekOptions"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="week"
            placeholder="All weeks"
            [showClear]="true"
            class="!w-48"
            ariaLabel="Filter by week"
          />
        </div>
      </div>
      @if (reports.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load reports"
          actionLabel="Retry"
          (action)="reports.reload()"
        />
      } @else if (reports.isLoading()) {
        <app-table-skeleton [rows]="8" [cols]="6" />
      } @else {
        <p-table
          [value]="filtered()"
          dataKey="id"
          [rowHover]="true"
          [paginator]="true"
          [rows]="15"
          [scrollable]="true"
          scrollHeight="60vh"
          [tableStyle]="{ 'min-width': '1040px' }"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="{first}–{last} of {totalRecords}"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="weekStart">Week <p-sorticon field="weekStart" /></th>
              <th pSortableColumn="studentName">Student <p-sorticon field="studentName" /></th>
              <th pSortableColumn="batchCode">Batch <p-sorticon field="batchCode" /></th>
              <th pSortableColumn="mentorName">Mentor <p-sorticon field="mentorName" /></th>
              <th pSortableColumn="progressRating">
                Progress <p-sorticon field="progressRating" />
              </th>
              <th>Strengths</th>
              <th class="w-20"></th>
            </tr>
          </ng-template>
          <ng-template #body let-r>
            <tr>
              <td class="whitespace-nowrap">{{ r.weekStart | appDate }}</td>
              <td class="cell-primary">{{ r.studentName }}</td>
              <td class="mono">{{ r.batchCode }}</td>
              <td>{{ r.mentorName }}</td>
              <td><app-rating-dots [value]="r.progressRating" [showLabel]="false" /></td>
              <td class="max-w-72">
                <p class="truncate text-ink-secondary">{{ r.strengths }}</p>
              </td>
              <td>
                <button type="button" class="btn btn-ghost btn-sm" (click)="view(r)">View</button>
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="7">
                <app-empty-state
                  icon="clipboard-list"
                  title="No reports match"
                  message="Try another week or batch."
                />
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>

    <p-dialog
      [(visible)]="viewOpen"
      [header]="viewTitle()"
      [modal]="true"
      [draggable]="false"
      [dismissableMask]="true"
      [style]="{ width: '44rem' }"
      [breakpoints]="{ '768px': '96vw' }"
    >
      @if (selected(); as r) {
        <app-report-timeline [reports]="[r]" />
      }
    </p-dialog>
  `,
})
export class MentorReportsListPage {
  private readonly service = inject(MentorReportsService);
  private readonly coursesService = inject(CoursesService);
  private readonly employees = inject(EmployeesService);
  private readonly auth = inject(AuthService);

  protected readonly isAdmin = computed(() => this.auth.role() === 'Admin');
  private readonly myId = computed(() =>
    this.auth.role() === 'Mentor' ? (this.auth.user()?.employeeId ?? null) : null,
  );

  protected readonly search = signal('');
  protected readonly batchId = signal<string | null>(null);
  protected readonly mentorId = signal<string | null>(null);
  protected readonly week = signal<string | null>(null);
  protected readonly weekOptions = this.service
    .recentWeeks(8)
    .map((w) => ({ label: `Week of ${formatDate(w)}`, value: w }));

  private readonly batches = rxResource({
    params: () => ({ mentorId: this.myId() }),
    stream: ({ params }) => this.coursesService.getBatches(params),
    defaultValue: [],
  });
  protected readonly batchOptions = computed(() =>
    this.batches
      .value()
      .filter((b) => b.status !== 'Upcoming')
      .map((b) => ({ label: `${b.code} · ${b.courseName}`, value: b.id })),
  );
  protected readonly mentors = rxResource({
    stream: () =>
      this.employees
        .getEmployees({ roles: ['Mentor'] })
        .pipe(map((l) => l.map((e) => ({ label: e.name, value: e.id })))),
    defaultValue: [],
  });

  protected readonly pending = rxResource({
    params: () => this.myId() ?? '',
    stream: ({ params }) => this.service.getPending(params || null),
    defaultValue: [],
  });
  protected readonly pendingTotal = computed(() =>
    this.pending.value().reduce((s, p) => s + p.pendingCount, 0),
  );

  protected readonly reports = rxResource({
    params: () => ({
      batchId: this.batchId(),
      mentorId: this.myId() ?? this.mentorId(),
      weekStart: this.week(),
    }),
    stream: ({ params }) => this.service.getReports(params),
    defaultValue: [],
  });
  protected readonly filtered = computed(() => {
    const q = this.search().toLowerCase();
    const list = this.reports.hasValue() ? this.reports.value() : [];
    return q ? list.filter((r) => r.studentName.toLowerCase().includes(q)) : list;
  });

  protected readonly viewOpen = signal(false);
  protected readonly selected = signal<MentorReportView | null>(null);
  protected readonly viewTitle = computed(() => this.selected()?.studentName ?? 'Report');

  protected canWrite(mentorId: string): boolean {
    return this.isAdmin() || this.myId() === mentorId;
  }

  protected view(r: MentorReportView): void {
    this.selected.set(r);
    this.viewOpen.set(true);
  }

  protected exportCsv(): void {
    downloadCsv(
      'mentor-reports',
      [
        { header: 'Week', value: (r: MentorReportView) => r.weekStart },
        { header: 'Student', value: (r) => r.studentName },
        { header: 'Batch', value: (r) => r.batchCode },
        { header: 'Mentor', value: (r) => r.mentorName },
        { header: 'Rating', value: (r) => r.progressRating },
        { header: 'Attendance', value: (r) => r.attendanceRemark },
        { header: 'Strengths', value: (r) => r.strengths },
        { header: 'Improvements', value: (r) => r.improvements },
        { header: 'Remarks', value: (r) => r.remarks },
      ],
      this.filtered(),
    );
  }
}
