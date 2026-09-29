import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { map } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Employee, EmployeeStatus, StaffRole } from '../../../../domain/models';
import { AppDatePipe } from '../../../../shared/pipes/format.pipes';
import { downloadCsv } from '../../../../shared/utils/csv.util';
import { Avatar } from '../../../../shared/ui/avatar';
import { ConfirmService } from '../../../../shared/ui/confirm.service';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header';
import { RowAction, RowActions } from '../../../../shared/ui/row-actions';
import { SearchInput } from '../../../../shared/ui/search-input';
import { StatusBadge } from '../../../../shared/ui/status-badge';
import { TableSkeleton } from '../../../../shared/ui/table-skeleton';
import { ToastService } from '../../../../shared/ui/toast.service';
import { EmployeesService } from '../../../../data/services/employees.service';
import { EmployeeFormDialog } from './employee-form-dialog';

@Component({
  selector: 'app-employees-page',
  imports: [
    FormsModule,
    RouterLink,
    LucideDynamicIcon,
    TableModule,
    SelectModule,
    PageHeader,
    SearchInput,
    Avatar,
    StatusBadge,
    EmptyState,
    TableSkeleton,
    RowActions,
    EmployeeFormDialog,
    AppDatePipe,
  ],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header
      title="Employees"
      [subtitle]="
        activeCount() + ' active staff across ' + departments.value().length + ' departments.'
      "
    >
      <button type="button" class="btn btn-secondary" (click)="exportCsv()">
        <svg lucideIcon="download" size="15" /> Export
      </button>
      <button type="button" class="btn btn-primary" (click)="open(null)">
        <svg lucideIcon="plus" size="15" /> Add employee
      </button>
    </app-page-header>

    <div class="table-card">
      <div class="table-toolbar">
        <app-search-input
          class="w-full sm:w-72"
          [(value)]="search"
          placeholder="Search name, ID, email…"
        />
        <div class="flex flex-wrap items-center gap-2">
          <p-select
            [options]="departments.value()"
            [(ngModel)]="department"
            placeholder="All departments"
            [showClear]="true"
            class="!w-52"
            ariaLabel="Filter by department"
          />
          <p-select
            [options]="roles"
            [(ngModel)]="role"
            placeholder="All roles"
            [showClear]="true"
            class="!w-36"
            ariaLabel="Filter by role"
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
      @if (employees.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load employees"
          actionLabel="Retry"
          (action)="employees.reload()"
        />
      } @else if (employees.isLoading() && !employees.value().length) {
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
          [tableStyle]="{ 'min-width': '1120px' }"
          sortField="id"
          [sortOrder]="1"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="id" class="w-28">ID <p-sorticon field="id" /></th>
              <th pSortableColumn="name">Employee <p-sorticon field="name" /></th>
              <th pSortableColumn="role">Role <p-sorticon field="role" /></th>
              <th pSortableColumn="department">Department <p-sorticon field="department" /></th>
              <th pSortableColumn="designation">Designation <p-sorticon field="designation" /></th>
              <th>Contact</th>
              <th pSortableColumn="joiningDate">Joined <p-sorticon field="joiningDate" /></th>
              <th pSortableColumn="status">Status <p-sorticon field="status" /></th>
              <th class="w-14"><span class="sr-only">Actions</span></th>
            </tr>
          </ng-template>
          <ng-template #body let-e>
            <tr>
              <td class="mono text-muted">{{ e.id }}</td>
              <td>
                <a
                  [routerLink]="['/hr/employees', e.id]"
                  class="flex items-center gap-3 hover:underline"
                >
                  <app-avatar [name]="e.name" size="sm" />
                  <span class="cell-primary">{{ e.name }}</span>
                </a>
              </td>
              <td><app-status-badge [status]="e.role" tone="neutral" [dot]="false" /></td>
              <td>{{ e.department }}</td>
              <td>{{ e.designation }}</td>
              <td>
                <p class="whitespace-nowrap">{{ e.phone }}</p>
                <p class="cell-meta">{{ e.email }}</p>
              </td>
              <td class="whitespace-nowrap">{{ e.joiningDate | appDate }}</td>
              <td><app-status-badge [status]="e.status" /></td>
              <td><app-row-actions [actions]="actionsFor(e)" [label]="e.name" /></td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="9">
                <app-empty-state
                  icon="users"
                  title="No employees match"
                  actionLabel="Add employee"
                  (action)="open(null)"
                />
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>
    <app-employee-form-dialog
      [(visible)]="formOpen"
      [employee]="editing()"
      (saved)="employees.reload()"
    />
  `,
})
export class EmployeesPage {
  private readonly service = inject(EmployeesService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly roles: StaffRole[] = ['Admin', 'Advisor', 'Mentor', 'Sales'];
  protected readonly statuses: EmployeeStatus[] = ['Active', 'Inactive'];
  protected readonly search = signal('');
  protected readonly department = signal<string | null>(null);
  protected readonly role = signal<StaffRole | null>(null);
  protected readonly status = signal<EmployeeStatus | null>(null);

  protected readonly departments = rxResource({
    stream: () => this.service.getDepartments().pipe(map((d) => d.map((x) => x.name))),
    defaultValue: [],
  });
  protected readonly employees = rxResource({
    stream: () => this.service.getEmployees(),
    defaultValue: [],
  });
  private readonly list = computed(() => (this.employees.hasValue() ? this.employees.value() : []));
  protected readonly activeCount = computed(
    () => this.list().filter((e) => e.status === 'Active').length,
  );
  protected readonly filtered = computed(() => {
    const q = this.search().toLowerCase();
    return this.list().filter(
      (e) =>
        (!this.department() || e.department === this.department()) &&
        (!this.role() || e.role === this.role()) &&
        (!this.status() || e.status === this.status()) &&
        (!q || [e.name, e.id, e.email, e.designation].some((v) => v.toLowerCase().includes(q))),
    );
  });

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Employee | null>(null);

  protected open(e: Employee | null): void {
    this.editing.set(e);
    this.formOpen.set(true);
  }

  protected actionsFor(e: Employee): RowAction[] {
    const active = e.status === 'Active';
    return [
      {
        label: 'View profile',
        icon: 'eye',
        command: () => void this.router.navigate(['/hr/employees', e.id]),
      },
      { label: 'Edit', icon: 'pencil', command: () => this.open(e) },
      {
        label: active ? 'Deactivate' : 'Activate',
        icon: active ? 'user-x' : 'user-check',
        danger: active,
        command: () => this.toggle(e),
      },
    ];
  }

  private async toggle(e: Employee): Promise<void> {
    const deactivate = e.status === 'Active';
    const ok = await this.confirm.ask({
      header: deactivate ? 'Deactivate employee?' : 'Activate employee?',
      message: deactivate
        ? `${e.name} will lose access and be excluded from payroll.`
        : `${e.name} will regain access and be included in payroll.`,
      acceptLabel: deactivate ? 'Deactivate' : 'Activate',
      danger: deactivate,
    });
    if (!ok) return;
    this.service.setStatus(e.id, deactivate ? 'Inactive' : 'Active').subscribe(() => {
      this.toast.success(deactivate ? 'Employee deactivated' : 'Employee activated', e.name);
      this.employees.reload();
    });
  }

  protected exportCsv(): void {
    downloadCsv(
      'employees',
      [
        { header: 'ID', value: (e: Employee) => e.id },
        { header: 'Name', value: (e) => e.name },
        { header: 'Role', value: (e) => e.role },
        { header: 'Department', value: (e) => e.department },
        { header: 'Designation', value: (e) => e.designation },
        { header: 'Phone', value: (e) => e.phone },
        { header: 'Email', value: (e) => e.email },
        { header: 'Joining date', value: (e) => e.joiningDate },
        { header: 'Status', value: (e) => e.status },
      ],
      this.filtered(),
    );
  }
}
