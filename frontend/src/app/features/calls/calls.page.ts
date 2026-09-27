import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { map } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../core/auth/auth.service';
import { CallDirection, CallLogView, CallStatus } from '../../models';
import { AppDatePipe, DurationPipe } from '../../shared/pipes/format.pipes';
import { downloadCsv } from '../../shared/utils/csv.util';
import { addDays, dateToIso, parseIsoDate, todayIso } from '../../shared/utils/date.util';
import { formatDuration } from '../../shared/utils/format.util';
import { Avatar } from '../../shared/ui/avatar';
import { EmptyState } from '../../shared/ui/empty-state';
import { PageHeader } from '../../shared/ui/page-header';
import { SearchInput } from '../../shared/ui/search-input';
import { StatusBadge } from '../../shared/ui/status-badge';
import { TableSkeleton } from '../../shared/ui/table-skeleton';
import { CallsService } from './data-access/calls.service';

@Component({
  selector: 'app-calls-page',
  imports: [
    FormsModule,
    LucideDynamicIcon,
    TableModule,
    SelectModule,
    DatePickerModule,
    PageHeader,
    SearchInput,
    Avatar,
    StatusBadge,
    EmptyState,
    TableSkeleton,
    AppDatePipe,
    DurationPipe,
  ],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header
      title="Sales calls"
      [subtitle]="
        isSales() ? 'Your incoming and outgoing calls.' : 'Call activity across the sales team.'
      "
    >
      <button type="button" class="btn btn-secondary" (click)="exportCsv()">
        <svg lucideIcon="download" size="15" /> Export CSV
      </button>
    </app-page-header>

    <div
      class="mb-4 flex items-start gap-3 rounded-card border border-line bg-white px-4 py-3 text-[13px] text-ink-secondary"
    >
      <svg lucideIcon="plug-zap" size="16" class="mt-0.5 shrink-0 text-ink" />
      <p>
        Calls will be synced automatically from the telephony provider (IVR / cloud telephony). The
        data below is sample data for the demo — no calls are placed from this app.
      </p>
    </div>

    <section class="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Call statistics">
      @for (s of stats.value(); track s.salespersonId) {
        <article class="card card-pad">
          <div class="flex items-center gap-3">
            <app-avatar [name]="s.salespersonName" size="sm" />
            <div class="min-w-0">
              <p class="truncate text-[13px] font-semibold">{{ s.salespersonName }}</p>
              <p class="text-xs text-muted">{{ s.total }} calls · talk {{ talk(s.talkTimeSec) }}</p>
            </div>
          </div>
          <dl class="mt-4 grid grid-cols-3 gap-2 text-center">
            <div class="rounded-lg bg-surface-muted py-2">
              <dt class="text-[11px] text-muted">Answered</dt>
              <dd class="font-semibold tabular-nums">{{ s.answered }}</dd>
            </div>
            <div class="rounded-lg bg-surface-muted py-2">
              <dt class="text-[11px] text-muted">Missed</dt>
              <dd
                class="font-semibold tabular-nums"
                [class.text-red-700]="s.missed > s.total * 0.3"
              >
                {{ s.missed }}
              </dd>
            </div>
            <div class="rounded-lg bg-surface-muted py-2">
              <dt class="text-[11px] text-muted">Avg.</dt>
              <dd class="font-semibold tabular-nums">{{ s.avgDurationSec | duration }}</dd>
            </div>
          </dl>
          <div
            class="mt-3 flex h-1.5 overflow-hidden rounded-full bg-neutral-100"
            role="img"
            [attr.aria-label]="s.answered + ' answered of ' + s.total"
          >
            <span
              class="bg-neutral-950"
              [style.width.%]="s.total ? (s.answered / s.total) * 100 : 0"
            ></span>
          </div>
        </article>
      } @empty {
        @if (!stats.isLoading()) {
          <div class="card sm:col-span-2 xl:col-span-4">
            <app-empty-state icon="phone" title="No calls in this range" />
          </div>
        }
      }
    </section>

    <div class="table-card">
      <div class="table-toolbar !items-start lg:!items-center">
        <app-search-input
          class="w-full lg:w-60"
          [(value)]="search"
          placeholder="Search number or lead…"
        />
        <div class="flex flex-wrap items-center gap-2">
          <p-datepicker
            [(ngModel)]="range"
            selectionMode="range"
            [readonlyInput]="true"
            dateFormat="dd M yy"
            placeholder="Date range"
            [showIcon]="true"
            iconDisplay="input"
            [showButtonBar]="true"
            [maxDate]="today"
            class="!w-60"
            inputId="call-range"
            ariaLabel="Date range"
            appendTo="body"
          />
          @if (!isSales()) {
            <p-select
              [options]="salespeople.value()"
              optionLabel="label"
              optionValue="value"
              [(ngModel)]="salespersonId"
              placeholder="All salespeople"
              [showClear]="true"
              class="!w-44"
              ariaLabel="Filter by salesperson"
            />
          }
          <p-select
            [options]="directions"
            [(ngModel)]="direction"
            placeholder="Direction"
            [showClear]="true"
            class="!w-36"
            ariaLabel="Filter by direction"
          />
          <p-select
            [options]="statuses"
            [(ngModel)]="status"
            placeholder="Status"
            [showClear]="true"
            class="!w-36"
            ariaLabel="Filter by status"
          />
        </div>
      </div>
      @if (calls.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load calls"
          actionLabel="Retry"
          (action)="calls.reload()"
        />
      } @else if (calls.isLoading()) {
        <app-table-skeleton [rows]="10" [cols]="6" />
      } @else {
        <p-table
          [value]="filtered()"
          dataKey="id"
          [rowHover]="true"
          [paginator]="true"
          [rows]="20"
          [rowsPerPageOptions]="[20, 50, 100]"
          [scrollable]="true"
          scrollHeight="60vh"
          [tableStyle]="{ 'min-width': '920px' }"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="{first}–{last} of {totalRecords}"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="at">Date & time <p-sorticon field="at" /></th>
              <th pSortableColumn="salespersonName">
                Salesperson <p-sorticon field="salespersonName" />
              </th>
              <th>Phone number</th>
              <th pSortableColumn="leadName">Lead <p-sorticon field="leadName" /></th>
              <th pSortableColumn="direction">Direction <p-sorticon field="direction" /></th>
              <th pSortableColumn="status">Status <p-sorticon field="status" /></th>
              <th pSortableColumn="durationSec" class="text-right">
                Duration <p-sorticon field="durationSec" />
              </th>
            </tr>
          </ng-template>
          <ng-template #body let-c>
            <tr>
              <td class="whitespace-nowrap">{{ c.at | appDate: 'datetime' }}</td>
              <td>{{ c.salespersonName }}</td>
              <td class="mono whitespace-nowrap">{{ c.phone }}</td>
              <td>
                @if (c.leadName) {
                  <p class="cell-primary">{{ c.leadName }}</p>
                  <p class="cell-meta">{{ c.leadId }}</p>
                } @else {
                  <span class="text-muted">Unknown number</span>
                }
              </td>
              <td>
                <span class="inline-flex items-center gap-1.5">
                  <svg
                    [lucideIcon]="c.direction === 'Incoming' ? 'phone-incoming' : 'phone-outgoing'"
                    size="14"
                    class="text-muted"
                  />
                  {{ c.direction }}
                </span>
              </td>
              <td><app-status-badge [status]="c.status" /></td>
              <td class="text-right tabular-nums">
                {{ c.durationSec ? (c.durationSec | duration) : '—' }}
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="7">
                <app-empty-state
                  icon="phone-off"
                  title="No calls match"
                  message="Adjust the date range or filters."
                />
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>
  `,
})
export class CallsPage {
  private readonly service = inject(CallsService);
  private readonly auth = inject(AuthService);

  protected readonly isSales = computed(() => this.auth.role() === 'Sales');
  protected readonly today = parseIsoDate(todayIso());
  protected readonly directions: CallDirection[] = ['Incoming', 'Outgoing'];
  protected readonly statuses: CallStatus[] = ['Answered', 'Missed'];
  protected readonly search = signal('');
  protected readonly range = signal<Date[] | null>([
    parseIsoDate(addDays(todayIso(), -6)),
    parseIsoDate(todayIso()),
  ]);
  protected readonly salespersonId = signal<string | null>(null);
  protected readonly direction = signal<CallDirection | null>(null);
  protected readonly status = signal<CallStatus | null>(null);

  protected readonly salespeople = rxResource({
    stream: () =>
      this.service
        .getSalespeople()
        .pipe(map((l) => l.map((e) => ({ label: e.name, value: e.id })))),
    defaultValue: [],
  });

  private readonly filters = computed(() => {
    const [from, to] = this.range() ?? [];
    return {
      from: dateToIso(from),
      to: dateToIso(to ?? from),
      salespersonId: this.isSales() ? (this.auth.user()?.employeeId ?? null) : this.salespersonId(),
      direction: this.direction(),
      status: this.status(),
    };
  });
  protected readonly calls = rxResource({
    params: () => this.filters(),
    stream: ({ params }) => this.service.getCalls(params),
    defaultValue: [],
  });
  protected readonly stats = rxResource({
    params: () => ({ ...this.filters(), direction: null, status: null }),
    stream: ({ params }) => this.service.getStats(params),
    defaultValue: [],
  });

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.calls.hasValue() ? this.calls.value() : [];
    return q
      ? list.filter(
          (c) =>
            c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
            (c.leadName ?? '').toLowerCase().includes(q),
        )
      : list;
  });

  protected talk(sec: number): string {
    return formatDuration(sec);
  }

  protected exportCsv(): void {
    downloadCsv(
      'call-log',
      [
        { header: 'Date & time', value: (c: CallLogView) => c.at.replace('T', ' ') },
        { header: 'Salesperson', value: (c) => c.salespersonName },
        { header: 'Phone', value: (c) => c.phone },
        { header: 'Lead', value: (c) => c.leadName ?? '' },
        { header: 'Direction', value: (c) => c.direction },
        { header: 'Status', value: (c) => c.status },
        { header: 'Duration (sec)', value: (c) => c.durationSec },
      ],
      this.filtered(),
    );
  }
}
