import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../core/auth/auth.service';
import { BatchStatus, BatchView } from '../../models';
import { AppDatePipe } from '../../shared/pipes/format.pipes';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { EmptyState } from '../../shared/ui/empty-state';
import { Meter } from '../../shared/ui/meter';
import { RowAction, RowActions } from '../../shared/ui/row-actions';
import { SearchInput } from '../../shared/ui/search-input';
import { StatusBadge } from '../../shared/ui/status-badge';
import { TableSkeleton } from '../../shared/ui/table-skeleton';
import { ToastService } from '../../shared/ui/toast.service';
import { BatchFormDialog } from './batch-form-dialog';
import { CoursesService } from './data-access/courses.service';

@Component({
  selector: 'app-batches-list',
  imports: [
    FormsModule,
    LucideDynamicIcon,
    TableModule,
    SelectModule,
    SearchInput,
    StatusBadge,
    Meter,
    EmptyState,
    TableSkeleton,
    RowActions,
    BatchFormDialog,
    AppDatePipe,
  ],
  template: `
    <div class="table-card">
      <div class="table-toolbar">
        <app-search-input
          class="w-full sm:w-72"
          [(value)]="search"
          placeholder="Search batch, course, mentor…"
        />
        <div class="flex flex-wrap items-center gap-2">
          <p-select
            [options]="statuses"
            [(ngModel)]="status"
            placeholder="All statuses"
            [showClear]="true"
            class="!w-40"
            ariaLabel="Filter by status"
          />
          @if (isAdmin()) {
            <button type="button" class="btn btn-primary" (click)="open(null)">
              <svg lucideIcon="plus" size="15" /> Create batch
            </button>
          }
        </div>
      </div>
      @if (batches.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load batches"
          actionLabel="Retry"
          (action)="batches.reload()"
        />
      } @else if (batches.isLoading() && !batches.value().length) {
        <app-table-skeleton [rows]="8" [cols]="7" />
      } @else {
        <p-table
          [value]="filtered()"
          dataKey="id"
          [rowHover]="true"
          [paginator]="true"
          [rows]="15"
          [scrollable]="true"
          scrollHeight="64vh"
          [tableStyle]="{ 'min-width': '1000px' }"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="code">Batch <p-sorticon field="code" /></th>
              <th pSortableColumn="courseName">Course <p-sorticon field="courseName" /></th>
              <th pSortableColumn="mentorName">Mentor <p-sorticon field="mentorName" /></th>
              <th>Timing</th>
              <th pSortableColumn="startDate">Start date <p-sorticon field="startDate" /></th>
              <th pSortableColumn="enrolled" class="w-44">
                Enrolled <p-sorticon field="enrolled" />
              </th>
              <th pSortableColumn="status">Status <p-sorticon field="status" /></th>
              <th class="w-14"><span class="sr-only">Actions</span></th>
            </tr>
          </ng-template>
          <ng-template #body let-b>
            <tr>
              <td>
                <p class="mono font-medium">{{ b.code }}</p>
                <p class="cell-meta">{{ b.mode }}</p>
              </td>
              <td>{{ b.courseName }}</td>
              <td>{{ b.mentorName }}</td>
              <td class="whitespace-nowrap">{{ b.timing }}</td>
              <td class="whitespace-nowrap">
                <p>{{ b.startDate | appDate }}</p>
                <p class="cell-meta">ends {{ b.endDate | appDate }}</p>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <span class="w-12 text-xs font-medium tabular-nums"
                    >{{ b.enrolled }}/{{ b.capacity }}</span
                  >
                  <app-meter
                    class="flex-1"
                    [value]="capacityPct(b)"
                    [showValue]="false"
                    [thresholds]="false"
                    ariaLabel="Seats filled"
                  />
                </div>
              </td>
              <td><app-status-badge [status]="b.status" /></td>
              <td><app-row-actions [actions]="actionsFor(b)" [label]="b.code" /></td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="8"><app-empty-state icon="layers" title="No batches found" /></td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>
    <app-batch-form-dialog [(visible)]="formOpen" [batch]="editing()" (saved)="batches.reload()" />
  `,
})
export class BatchesList {
  private readonly service = inject(CoursesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly isAdmin = computed(() => this.auth.role() === 'Admin');
  protected readonly statuses: BatchStatus[] = ['Ongoing', 'Upcoming', 'Completed'];
  protected readonly search = signal('');
  protected readonly status = signal<BatchStatus | null>(null);

  protected readonly batches = rxResource({
    params: () => ({
      mentorId: this.auth.role() === 'Mentor' ? (this.auth.user()?.employeeId ?? null) : null,
    }),
    stream: ({ params }) => this.service.getBatches(params),
    defaultValue: [],
  });
  protected readonly filtered = computed(() => {
    const q = this.search().toLowerCase();
    const list = this.batches.hasValue() ? this.batches.value() : [];
    return list.filter(
      (b) =>
        (!this.status() || b.status === this.status()) &&
        (!q || [b.code, b.courseName, b.mentorName].some((v) => v.toLowerCase().includes(q))),
    );
  });

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<BatchView | null>(null);

  protected capacityPct(b: BatchView): number {
    return Math.round((b.enrolled / b.capacity) * 100);
  }

  protected open(b: BatchView | null): void {
    this.editing.set(b);
    this.formOpen.set(true);
  }

  protected actionsFor(b: BatchView): RowAction[] {
    const canMark = this.auth.hasRole('Admin', 'Mentor') && b.status === 'Ongoing';
    return [
      {
        label: 'View students',
        icon: 'users',
        command: () => void this.router.navigate(['/students'], { queryParams: { batch: b.id } }),
      },
      {
        label: 'Mark attendance',
        icon: 'calendar-check',
        visible: canMark,
        command: () =>
          void this.router.navigate(['/attendance/mark'], { queryParams: { batch: b.id } }),
      },
      {
        label: 'Monthly register',
        icon: 'table',
        visible: canMark,
        command: () =>
          void this.router.navigate(['/attendance/register'], { queryParams: { batch: b.id } }),
      },
      { label: 'Edit batch', icon: 'pencil', visible: this.isAdmin(), command: () => this.open(b) },
      {
        label: 'Delete',
        icon: 'trash',
        danger: true,
        visible: this.isAdmin(),
        command: () => this.remove(b),
      },
    ];
  }

  private async remove(b: BatchView): Promise<void> {
    const ok = await this.confirm.ask({
      header: 'Delete batch?',
      message: `Delete ${b.code}? This can't be undone.`,
      acceptLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.service.deleteBatch(b.id).subscribe({
      next: () => {
        this.toast.success('Batch deleted', b.code);
        this.batches.reload();
      },
      error: (e: Error) => this.toast.error('Cannot delete batch', e.message),
    });
  }
}
