import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../core/auth/auth.service';
import { Course } from '../../models';
import { InrPipe } from '../../shared/pipes/format.pipes';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { EmptyState } from '../../shared/ui/empty-state';
import { RowAction, RowActions } from '../../shared/ui/row-actions';
import { SearchInput } from '../../shared/ui/search-input';
import { StatusBadge } from '../../shared/ui/status-badge';
import { TableSkeleton } from '../../shared/ui/table-skeleton';
import { ToastService } from '../../shared/ui/toast.service';
import { CourseFormDialog } from './course-form-dialog';
import { CoursesService } from './data-access/courses.service';

@Component({
  selector: 'app-courses-list',
  imports: [
    LucideDynamicIcon,
    TableModule,
    SearchInput,
    StatusBadge,
    EmptyState,
    TableSkeleton,
    RowActions,
    CourseFormDialog,
    InrPipe,
  ],
  template: `
    <div class="table-card">
      <div class="table-toolbar">
        <app-search-input class="w-full sm:w-72" [(value)]="search" placeholder="Search courses…" />
        @if (isAdmin()) {
          <button type="button" class="btn btn-primary" (click)="open(null)">
            <svg lucideIcon="plus" size="15" /> Add course
          </button>
        }
      </div>
      @if (courses.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load courses"
          actionLabel="Retry"
          (action)="courses.reload()"
        />
      } @else if (courses.isLoading() && !courses.value().length) {
        <app-table-skeleton [rows]="6" [cols]="6" />
      } @else {
        <p-table
          [value]="filtered()"
          dataKey="id"
          [rowHover]="true"
          [scrollable]="true"
          [tableStyle]="{ 'min-width': '860px' }"
          sortField="name"
          [sortOrder]="1"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="name">Course <p-sorticon field="name" /></th>
              <th pSortableColumn="code">Code <p-sorticon field="code" /></th>
              <th pSortableColumn="category">Category <p-sorticon field="category" /></th>
              <th pSortableColumn="durationMonths">
                Duration <p-sorticon field="durationMonths" />
              </th>
              <th pSortableColumn="fee" class="text-right">Fee <p-sorticon field="fee" /></th>
              <th pSortableColumn="status">Status <p-sorticon field="status" /></th>
              <th class="w-14"><span class="sr-only">Actions</span></th>
            </tr>
          </ng-template>
          <ng-template #body let-c>
            <tr>
              <td>
                <p class="cell-primary">{{ c.name }}</p>
                <p class="cell-meta line-clamp-1 max-w-md">{{ c.description }}</p>
              </td>
              <td class="mono">{{ c.code }}</td>
              <td>{{ c.category }}</td>
              <td>{{ c.durationMonths }} months</td>
              <td class="text-right font-medium tabular-nums">{{ c.fee | inr }}</td>
              <td><app-status-badge [status]="c.status" /></td>
              <td>
                @if (isAdmin()) {
                  <app-row-actions [actions]="actionsFor(c)" [label]="c.name" />
                }
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="7"><app-empty-state icon="book-open" title="No courses found" /></td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>
    <app-course-form-dialog
      [(visible)]="formOpen"
      [course]="editing()"
      (saved)="courses.reload()"
    />
  `,
})
export class CoursesList {
  private readonly service = inject(CoursesService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  protected readonly isAdmin = computed(() => this.auth.role() === 'Admin');

  protected readonly search = signal('');
  protected readonly courses = rxResource({
    stream: () => this.service.getCourses(),
    defaultValue: [],
  });
  protected readonly filtered = computed(() => {
    const q = this.search().toLowerCase();
    const list = this.courses.hasValue() ? this.courses.value() : [];
    return list.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  });

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Course | null>(null);

  protected open(c: Course | null): void {
    this.editing.set(c);
    this.formOpen.set(true);
  }

  protected actionsFor(c: Course): RowAction[] {
    return [
      { label: 'Edit', icon: 'pencil', command: () => this.open(c) },
      {
        label: c.status === 'Active' ? 'Mark inactive' : 'Mark active',
        icon: c.status === 'Active' ? 'circle-pause' : 'circle-play',
        command: () =>
          this.service
            .updateCourse(c.id, { ...c, status: c.status === 'Active' ? 'Inactive' : 'Active' })
            .subscribe(() => {
              this.toast.success('Course updated', c.name);
              this.courses.reload();
            }),
      },
      { label: 'Delete', icon: 'trash', danger: true, command: () => this.remove(c) },
    ];
  }

  private async remove(c: Course): Promise<void> {
    const ok = await this.confirm.ask({
      header: 'Delete course?',
      message: `Delete ${c.name}? This can't be undone.`,
      acceptLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.service.deleteCourse(c.id).subscribe({
      next: () => {
        this.toast.success('Course deleted', c.name);
        this.courses.reload();
      },
      error: (e: Error) => this.toast.error('Cannot delete course', e.message),
    });
  }
}
