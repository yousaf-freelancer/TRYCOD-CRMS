import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { AppDatePipe, InrPipe } from '../../../shared/pipes/format.pipes';
import { formatDate } from '../../../shared/utils/date.util';
import { Avatar } from '../../../shared/ui/avatar';
import { DetailItem, DetailList } from '../../../shared/ui/detail-list';
import { EmptyState } from '../../../shared/ui/empty-state';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { EmployeesService, grossOf } from '../data-access/employees.service';
import { LeaveService } from '../data-access/leave.service';
import { PayrollService } from '../data-access/payroll.service';
import { EmployeeAttendancePanel } from '../ui/employee-attendance-panel';
import { LeaveBalanceCards } from '../ui/leave-balance-cards';
import { EmployeeFormDialog } from './employee-form-dialog';

@Component({
  selector: 'app-employee-profile-page',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    SkeletonModule,
    TabsModule,
    TableModule,
    Avatar,
    StatusBadge,
    DetailList,
    EmptyState,
    EmployeeAttendancePanel,
    LeaveBalanceCards,
    EmployeeFormDialog,
    InrPipe,
    AppDatePipe,
  ],
  host: { class: 'block page-enter' },
  template: `
    <a
      routerLink="/hr/employees"
      class="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink"
      ><svg lucideIcon="arrow-left" size="14" /> Employees</a
    >

    @if (employee.error()) {
      <div class="card">
        <app-empty-state
          variant="error"
          title="Couldn't load employee"
          actionLabel="Retry"
          (action)="employee.reload()"
        />
      </div>
    } @else if (employee.isLoading() && !employee.value()) {
      <div class="card card-pad"><p-skeleton height="5rem" /></div>
    } @else if (employee.value(); as e) {
      <header class="card card-pad flex flex-col gap-5 md:flex-row md:items-center">
        <app-avatar [name]="e.name" size="xl" />
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-xl font-semibold tracking-tight">{{ e.name }}</h1>
            <app-status-badge [status]="e.status" />
            <app-status-badge [status]="e.role" tone="dark" [dot]="false" />
          </div>
          <p class="mt-1 text-[13px] text-muted">
            <span class="mono">{{ e.id }}</span> · {{ e.designation }} · {{ e.department }}
          </p>
          <div class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-secondary">
            <span class="inline-flex items-center gap-1.5"
              ><svg lucideIcon="phone" size="14" /> {{ e.phone }}</span
            >
            <span class="inline-flex items-center gap-1.5"
              ><svg lucideIcon="mail" size="14" /> {{ e.email }}</span
            >
            <span class="inline-flex items-center gap-1.5"
              ><svg lucideIcon="calendar" size="14" /> Joined {{ e.joiningDate | appDate }}</span
            >
          </div>
        </div>
        <button type="button" class="btn btn-secondary" (click)="editOpen.set(true)">
          <svg lucideIcon="pencil" size="15" /> Edit
        </button>
      </header>

      <p-tabs [(value)]="tab" class="mt-6" [lazy]="true" [scrollable]="true">
        <p-tablist>
          <p-tab value="overview">Overview</p-tab>
          <p-tab value="attendance">Attendance</p-tab>
          <p-tab value="leave">Leave</p-tab>
          <p-tab value="salary">Salary structure</p-tab>
          <p-tab value="payslips">Payslips</p-tab>
        </p-tablist>
        <p-tabpanels class="!bg-transparent !px-0 !pt-5">
          <p-tabpanel value="overview">
            <section class="card card-pad">
              <app-detail-list [columns]="3" [items]="details()" />
            </section>
          </p-tabpanel>
          <p-tabpanel value="attendance">
            <app-employee-attendance-panel [employeeId]="e.id" />
          </p-tabpanel>
          <p-tabpanel value="leave">
            <app-leave-balance-cards [balances]="balances.value()" />
            <div class="table-card mt-4">
              <p-table [value]="requests.value()" [tableStyle]="{ 'min-width': '720px' }">
                <ng-template #header>
                  <tr>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </ng-template>
                <ng-template #body let-r>
                  <tr>
                    <td>{{ r.leaveTypeName }}</td>
                    <td>{{ r.from | appDate }}</td>
                    <td>{{ r.to | appDate }}</td>
                    <td class="tabular-nums">{{ r.days }}</td>
                    <td class="max-w-xs truncate">{{ r.reason }}</td>
                    <td><app-status-badge [status]="r.status" /></td>
                  </tr>
                </ng-template>
                <ng-template #emptymessage
                  ><tr>
                    <td colspan="6">
                      <app-empty-state icon="plane" title="No leave requests" />
                    </td></tr
                ></ng-template>
              </p-table>
            </div>
          </p-tabpanel>
          <p-tabpanel value="salary">
            @if (salary.value(); as s) {
              <div class="grid gap-4 lg:grid-cols-2">
                <section class="card overflow-hidden">
                  <div class="card-header"><h3 class="card-title">Earnings (monthly)</h3></div>
                  <dl class="divide-y divide-neutral-100 text-[13px]">
                    @for (row of earnings(); track row.label) {
                      <div class="flex justify-between px-5 py-2.5">
                        <dt class="text-ink-secondary">{{ row.label }}</dt>
                        <dd class="tabular-nums">{{ row.amount | inr }}</dd>
                      </div>
                    }
                    <div class="flex justify-between bg-neutral-50 px-5 py-2.5 font-semibold">
                      <dt>Gross</dt>
                      <dd class="tabular-nums">{{ gross() | inr }}</dd>
                    </div>
                  </dl>
                </section>
                <section class="card overflow-hidden">
                  <div class="card-header"><h3 class="card-title">Statutory deductions</h3></div>
                  <dl class="divide-y divide-neutral-100 text-[13px]">
                    <div class="flex justify-between px-5 py-2.5">
                      <dt class="text-ink-secondary">Provident fund (12% of basic, capped)</dt>
                      <dd class="tabular-nums">{{ s.pf | inr }}</dd>
                    </div>
                    <div class="flex justify-between px-5 py-2.5">
                      <dt class="text-ink-secondary">ESI</dt>
                      <dd class="tabular-nums">{{ s.esi | inr }}</dd>
                    </div>
                    <div class="flex justify-between px-5 py-2.5">
                      <dt class="text-ink-secondary">Professional tax</dt>
                      <dd class="tabular-nums">{{ s.professionalTax | inr }}</dd>
                    </div>
                    <div class="flex justify-between px-5 py-2.5">
                      <dt class="text-ink-secondary">TDS</dt>
                      <dd class="tabular-nums">{{ s.tds | inr }}</dd>
                    </div>
                    <div class="flex justify-between bg-neutral-50 px-5 py-2.5 font-semibold">
                      <dt>Net (before LOP)</dt>
                      <dd class="tabular-nums">
                        {{ gross() - s.pf - s.esi - s.professionalTax - s.tds | inr }}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>
            }
          </p-tabpanel>
          <p-tabpanel value="payslips">
            <div class="table-card">
              <p-table [value]="payslips.value()" [tableStyle]="{ 'min-width': '640px' }">
                <ng-template #header>
                  <tr>
                    <th>Month</th>
                    <th class="text-right">Gross</th>
                    <th class="text-right">Deductions</th>
                    <th class="text-right">Net pay</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </ng-template>
                <ng-template #body let-p>
                  <tr>
                    <td class="font-medium">{{ p.month | appDate: 'monthLong' }}</td>
                    <td class="text-right tabular-nums">{{ p.gross | inr }}</td>
                    <td class="text-right tabular-nums">{{ p.deductions | inr }}</td>
                    <td class="text-right font-semibold tabular-nums">{{ p.netPay | inr }}</td>
                    <td><app-status-badge [status]="p.status" /></td>
                    <td class="text-right">
                      <a [routerLink]="['/hr/payslip', e.id, p.month]" class="btn btn-ghost btn-sm"
                        >View</a
                      >
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
      <app-employee-form-dialog
        [(visible)]="editOpen"
        [employee]="e"
        (saved)="employee.reload(); salary.reload()"
      />
    } @else {
      <div class="card"><app-empty-state icon="user-x" title="Employee not found" /></div>
    }
  `,
})
export class EmployeeProfilePage {
  private readonly employees = inject(EmployeesService);
  private readonly leave = inject(LeaveService);
  private readonly payroll = inject(PayrollService);

  readonly id = input.required<string>();
  protected readonly tab = signal<string | number | undefined>('overview');
  protected readonly editOpen = signal(false);

  protected readonly employee = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.employees.getEmployee(params),
  });
  protected readonly salary = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.employees.getSalaryStructure(params),
  });
  protected readonly balances = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.leave.getBalances(params),
    defaultValue: [],
  });
  protected readonly requests = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.leave.getRequests({ employeeId: params }),
    defaultValue: [],
  });
  protected readonly payslips = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.payroll.getEmployeePayslips(params),
    defaultValue: [],
  });

  private readonly allEmployees = rxResource({
    stream: () => this.employees.getEmployees(),
    defaultValue: [],
  });

  private readonly structure = computed(() =>
    this.salary.hasValue() ? this.salary.value() : null,
  );
  protected readonly gross = computed(() => {
    const s = this.structure();
    return s ? grossOf(s) : 0;
  });
  protected readonly earnings = computed(() => {
    const s = this.structure();
    return s
      ? [
          { label: 'Basic (40%)', amount: s.basic },
          { label: 'House rent allowance (20%)', amount: s.hra },
          { label: 'Conveyance', amount: s.conveyance },
          { label: 'Special allowance', amount: s.specialAllowance },
        ]
      : [];
  });

  protected readonly details = computed<DetailItem[]>(() => {
    const e = this.employee.hasValue() ? this.employee.value() : null;
    if (!e) return [];
    const manager = this.allEmployees.value().find((x) => x.id === e.reportingTo);
    return [
      { label: 'Employee ID', value: e.id, mono: true },
      { label: 'Gender', value: e.gender },
      { label: 'Date of birth', value: formatDate(e.dob) },
      { label: 'Department', value: e.department },
      { label: 'Designation', value: e.designation },
      { label: 'System role', value: e.role },
      { label: 'Reports to', value: manager ? `${manager.name} (${manager.designation})` : '—' },
      { label: 'Joining date', value: formatDate(e.joiningDate) },
      { label: 'Status', value: e.status },
      { label: 'Phone', value: e.phone },
      { label: 'Email', value: e.email },
      { label: 'Address', value: e.address },
      { label: 'Bank account', value: e.bankAccount, mono: true },
      { label: 'PAN', value: e.pan, mono: true },
    ];
  });
}
