import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../core/auth/auth.service';
import { FeeStatus, StudentListItem, StudentStatus } from '../../models';
import { downloadCsv } from '../../shared/utils/csv.util';
import { Avatar } from '../../shared/ui/avatar';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { EmptyState } from '../../shared/ui/empty-state';
import { Meter } from '../../shared/ui/meter';
import { PageHeader } from '../../shared/ui/page-header';
import { RowAction, RowActions } from '../../shared/ui/row-actions';
import { SearchInput } from '../../shared/ui/search-input';
import { StatusBadge } from '../../shared/ui/status-badge';
import { TableSkeleton } from '../../shared/ui/table-skeleton';
import { ToastService } from '../../shared/ui/toast.service';
import { ConvertAdmissionDialog } from '../admissions/convert/convert-admission-dialog';
import { CoursesService } from '../courses/data-access/courses.service';
import { StudentsService } from './data-access/students.service';
import { StudentFormDialog } from './student-form-dialog';

@Component({
  selector: 'app-students-list-page',
  imports: [
    FormsModule,
    RouterLink,
    LucideDynamicIcon,
    TableModule,
    SelectModule,
    PageHeader,
    SearchInput,
    Avatar,
    Meter,
    StatusBadge,
    EmptyState,
    TableSkeleton,
    RowActions,
    StudentFormDialog,
    ConvertAdmissionDialog,
  ],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header [title]="isMentor() ? 'My students' : 'Students'" [subtitle]="subtitle()">
      <button type="button" class="btn btn-secondary" (click)="exportCsv()">
        <svg lucideIcon="download" size="15" /> Export
      </button>
      @if (isAdmin()) {
        <button type="button" class="btn btn-primary" (click)="admitOpen.set(true)">
          <svg lucideIcon="plus" size="15" /> New admission
        </button>
      }
    </app-page-header>

    <div class="table-card">
      <div class="table-toolbar">
        <app-search-input
          class="w-full lg:w-72"
          [(value)]="search"
          placeholder="Search name, ID, phone…"
        />
        <div class="flex flex-wrap items-center gap-2">
          <p-select
            [options]="courses.value()"
            optionLabel="name"
            optionValue="id"
            [(ngModel)]="courseId"
            placeholder="All courses"
            [showClear]="true"
            class="!w-48"
            ariaLabel="Filter by course"
          />
          <p-select
            [options]="batchOptions()"
            optionLabel="code"
            optionValue="id"
            [(ngModel)]="batchId"
            placeholder="All batches"
            [showClear]="true"
            class="!w-40"
            ariaLabel="Filter by batch"
          />
          <p-select
            [options]="feeStatuses"
            [(ngModel)]="feeStatus"
            placeholder="Fee status"
            [showClear]="true"
            class="!w-36"
            ariaLabel="Filter by fee status"
          />
          <p-select
            [options]="statuses"
            [(ngModel)]="status"
            placeholder="Any status"
            [showClear]="true"
            class="!w-36"
            ariaLabel="Filter by status"
          />
        </div>
      </div>

      @if (students.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load students"
          actionLabel="Retry"
          (action)="students.reload()"
        />
      } @else if (students.isLoading() && !students.value().length) {
        <app-table-skeleton [rows]="10" [cols]="7" />
      } @else {
        <p-table
          [value]="filtered()"
          dataKey="id"
          [rowHover]="true"
          [paginator]="true"
          [rows]="15"
          [rowsPerPageOptions]="[15, 30, 60]"
          [scrollable]="true"
          scrollHeight="64vh"
          [tableStyle]="{ 'min-width': '1120px' }"
          sortField="name"
          [sortOrder]="1"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="{first}–{last} of {totalRecords}"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="name">Student <p-sorticon field="name" /></th>
              <th>Phone</th>
              <th pSortableColumn="courseName">Course <p-sorticon field="courseName" /></th>
              <th pSortableColumn="batchCode">Batch <p-sorticon field="batchCode" /></th>
              <th pSortableColumn="mentorName">Mentor <p-sorticon field="mentorName" /></th>
              <th pSortableColumn="attendancePct" class="w-40">
                Attendance <p-sorticon field="attendancePct" />
              </th>
              <th pSortableColumn="feeStatus">Fees <p-sorticon field="feeStatus" /></th>
              <th pSortableColumn="status">Status <p-sorticon field="status" /></th>
              <th class="w-14"><span class="sr-only">Actions</span></th>
            </tr>
          </ng-template>
          <ng-template #body let-s>
            <tr class="cursor-pointer" (click)="open(s.id)">
              <td>
                <div class="flex items-center gap-3">
                  <app-avatar [name]="s.name" size="sm" />
                  <div class="min-w-0">
                    <a
                      [routerLink]="['/students', s.id]"
                      class="cell-primary block truncate hover:underline"
                      (click)="$event.stopPropagation()"
                      >{{ s.name }}</a
                    >
                    <p class="cell-meta mono">{{ s.id }}</p>
                  </div>
                </div>
              </td>
              <td class="whitespace-nowrap">{{ s.phone }}</td>
              <td>{{ s.courseName }}</td>
              <td class="mono">{{ s.batchCode }}</td>
              <td>{{ s.mentorName }}</td>
              <td>
                @if (s.attendancePct) {
                  <app-meter [value]="s.attendancePct" ariaLabel="Attendance" />
                } @else {
                  <span class="text-xs text-muted">No records</span>
                }
              </td>
              <td><app-status-badge [status]="s.feeStatus" /></td>
              <td><app-status-badge [status]="s.status" /></td>
              <td (click)="$event.stopPropagation()">
                <app-row-actions [actions]="actionsFor(s)" [label]="s.name" />
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="9">
                <app-empty-state
                  icon="graduation-cap"
                  title="No students match"
                  message="Clear filters or try another search."
                  actionLabel="Clear filters"
                  (action)="clear()"
                />
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>

    <app-student-form-dialog
      [(visible)]="editOpen"
      [student]="editing()"
      (saved)="students.reload()"
    />
    <app-convert-admission-dialog [(visible)]="admitOpen" [source]="null" />
  `,
})
export class StudentsListPage {
  private readonly service = inject(StudentsService);
  private readonly coursesService = inject(CoursesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly isAdmin = computed(() => this.auth.role() === 'Admin');
  protected readonly isMentor = computed(() => this.auth.role() === 'Mentor');
  protected readonly statuses: StudentStatus[] = ['Active', 'Completed', 'Dropped'];
  protected readonly feeStatuses: FeeStatus[] = ['Paid', 'Partial', 'Overdue'];

  protected readonly search = signal('');
  protected readonly courseId = signal<string | null>(null);
  protected readonly batchId = signal<string | null>(null);
  protected readonly status = signal<StudentStatus | null>('Active');
  protected readonly feeStatus = signal<FeeStatus | null>(null);

  protected readonly courses = rxResource({
    stream: () => this.coursesService.getCourses(),
    defaultValue: [],
  });
  private readonly batches = rxResource({
    params: () => ({ mentorId: this.isMentor() ? (this.auth.user()?.employeeId ?? null) : null }),
    stream: ({ params }) => this.coursesService.getBatches(params),
    defaultValue: [],
  });
  protected readonly batchOptions = computed(() =>
    this.batches.value().filter((b) => !this.courseId() || b.courseId === this.courseId()),
  );

  protected readonly students = rxResource({
    params: () => ({ mentorId: this.isMentor() ? (this.auth.user()?.employeeId ?? null) : null }),
    stream: ({ params }) => this.service.getStudents(params),
    defaultValue: [],
  });

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.students.hasValue() ? this.students.value() : [];
    return list.filter(
      (s) =>
        (!this.courseId() || s.courseId === this.courseId()) &&
        (!this.batchId() || s.batchId === this.batchId()) &&
        (!this.status() || s.status === this.status()) &&
        (!this.feeStatus() || s.feeStatus === this.feeStatus()) &&
        (!q || [s.name, s.id, s.phone, s.email].some((v) => v.toLowerCase().includes(q))),
    );
  });

  protected readonly subtitle = computed(() => {
    const list = this.students.hasValue() ? this.students.value() : [];
    const active = list.filter((s) => s.status === 'Active').length;
    return `${active} active of ${list.length} students${this.isMentor() ? ' in your batches' : ''}.`;
  });

  protected readonly editOpen = signal(false);
  protected readonly editing = signal<StudentListItem | null>(null);
  protected readonly admitOpen = signal(false);

  /** Optional `?batch=` query param (e.g. from the batches list). */
  readonly batch = input<string>();

  constructor() {
    effect(() => {
      const batch = this.batch();
      if (batch) this.batchId.set(batch);
    });
  }

  protected open(id: string): void {
    void this.router.navigate(['/students', id]);
  }

  protected clear(): void {
    this.search.set('');
    this.courseId.set(null);
    this.batchId.set(null);
    this.status.set(null);
    this.feeStatus.set(null);
  }

  protected actionsFor(s: StudentListItem): RowAction[] {
    return [
      { label: 'View profile', icon: 'eye', command: () => this.open(s.id) },
      {
        label: 'Edit',
        icon: 'pencil',
        visible: this.isAdmin(),
        command: () => (this.editing.set(s), this.editOpen.set(true)),
      },
      {
        label: 'Collect fee',
        icon: 'indian-rupee',
        visible: this.auth.hasRole('Admin', 'Advisor') && s.balance > 0,
        command: () =>
          void this.router.navigate(['/fees/collect'], { queryParams: { student: s.id } }),
      },
      {
        label: 'Delete',
        icon: 'trash',
        danger: true,
        visible: this.isAdmin(),
        command: () => this.remove(s),
      },
    ];
  }

  private async remove(s: StudentListItem): Promise<void> {
    const ok = await this.confirm.ask({
      header: 'Delete student?',
      message: `This removes ${s.name} (${s.id}) from student records. Consider marking them as Dropped instead.`,
      acceptLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.service.deleteStudent(s.id).subscribe(() => {
      this.toast.success('Student deleted', s.name);
      this.students.reload();
    });
  }

  protected exportCsv(): void {
    downloadCsv(
      'students',
      [
        { header: 'ID', value: (s: StudentListItem) => s.id },
        { header: 'Name', value: (s) => s.name },
        { header: 'Phone', value: (s) => s.phone },
        { header: 'Email', value: (s) => s.email },
        { header: 'Course', value: (s) => s.courseName },
        { header: 'Batch', value: (s) => s.batchCode },
        { header: 'Mentor', value: (s) => s.mentorName },
        { header: 'Attendance %', value: (s) => s.attendancePct },
        { header: 'Fee status', value: (s) => s.feeStatus },
        { header: 'Balance', value: (s) => s.balance },
        { header: 'Status', value: (s) => s.status },
      ],
      this.filtered(),
    );
  }
}
