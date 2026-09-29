import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../../core/auth/auth.service';
import { FollowUpBucket, FollowUpView } from '../../../../domain/models';
import { AppDatePipe } from '../../../../shared/pipes/format.pipes';
import { formatTime } from '../../../../shared/utils/date.util';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { SearchInput } from '../../../../shared/ui/search-input';
import { StatusBadge } from '../../../../shared/ui/status-badge';
import { TableSkeleton } from '../../../../shared/ui/table-skeleton';
import { AdmissionsService } from '../../../../data/services/admissions.service';
import { Scope, ScopeToggle } from '../ui/scope-toggle';
import { FollowUpAction, FollowUpActionDialog } from './follow-up-action-dialog';

const BUCKETS: { key: FollowUpBucket; icon: string; hint: string }[] = [
  { key: 'Today', icon: 'sun', hint: 'Due today' },
  { key: 'Overdue', icon: 'alarm-clock', hint: 'Past due date' },
  { key: 'Upcoming', icon: 'calendar-days', hint: 'Scheduled ahead' },
  { key: 'Completed', icon: 'circle-check', hint: 'Done' },
];

const CHANNEL_ICONS: Record<string, string> = {
  Call: 'phone',
  WhatsApp: 'message-circle',
  Visit: 'map-pin',
  Email: 'mail',
};

@Component({
  selector: 'app-follow-ups-tab',
  imports: [
    LucideDynamicIcon,
    TooltipModule,
    SearchInput,
    StatusBadge,
    EmptyState,
    TableSkeleton,
    ScopeToggle,
    FollowUpActionDialog,
    AppDatePipe,
  ],
  template: `
    <div
      class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"
      role="tablist"
      aria-label="Follow-up buckets"
    >
      @for (b of buckets; track b.key) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="bucket() === b.key"
          class="card flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:border-neutral-400"
          [class.!border-neutral-950]="bucket() === b.key"
          [class.!shadow-pop]="bucket() === b.key"
          (click)="bucket.set(b.key)"
        >
          <span
            class="grid size-9 place-items-center rounded-lg"
            [class]="bucket() === b.key ? 'bg-neutral-950 text-white' : 'bg-surface-muted text-ink'"
          >
            <svg [lucideIcon]="b.icon" size="17" strokeWidth="1.75" />
          </span>
          <span>
            <span
              class="block text-lg leading-tight font-semibold tabular-nums"
              [class.text-red-700]="b.key === 'Overdue' && counts()[b.key] > 0"
              >{{ counts()[b.key] }}</span
            >
            <span class="block text-xs text-muted">{{ b.key }}</span>
          </span>
        </button>
      }
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <app-search-input
          class="w-full sm:w-72"
          [(value)]="search"
          placeholder="Search name, phone…"
        />
        @if (canToggleScope()) {
          <app-scope-toggle [(value)]="scope" />
        }
      </div>

      @if (followUps.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load follow-ups"
          actionLabel="Retry"
          (action)="followUps.reload()"
        />
      } @else if (followUps.isLoading() && !followUps.value().length) {
        <app-table-skeleton [rows]="6" [cols]="4" />
      } @else {
        <ul
          class="divide-y divide-neutral-100"
          role="tabpanel"
          [attr.aria-label]="bucket() + ' follow-ups'"
        >
          @for (f of visible(); track f.id) {
            <li class="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-center">
              <div
                class="flex w-28 shrink-0 items-center gap-2 lg:flex-col lg:items-start lg:gap-0.5"
              >
                <span class="text-[13px] font-semibold tabular-nums">{{ time(f.dueTime) }}</span>
                <span class="text-xs text-muted" [class.!text-red-700]="f.bucket === 'Overdue'">{{
                  f.dueDate | appDate
                }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-medium">{{ f.name }}</p>
                  <app-status-badge
                    [status]="f.relatedType"
                    [label]="f.relatedType + ' · ' + f.relatedId"
                    tone="neutral"
                    [dot]="false"
                  />
                </div>
                <p class="mt-0.5 text-[13px] text-ink-secondary">{{ f.purpose }}</p>
                <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span class="inline-flex items-center gap-1"
                    ><svg [lucideIcon]="channelIcon(f.channel)" size="12" /> {{ f.channel }} ·
                    {{ f.phone }}</span
                  >
                  <span>{{ f.courseName }}</span>
                  <span>Owner: {{ f.assignedToName }}</span>
                </p>
                @if (f.notes.length) {
                  <details class="mt-2 text-xs">
                    <summary class="cursor-pointer text-muted hover:text-ink">
                      {{ f.notes.length }} note{{ f.notes.length > 1 ? 's' : '' }}
                    </summary>
                    <ul class="mt-2 space-y-1.5 border-l border-line pl-3">
                      @for (n of f.notes; track $index) {
                        <li>
                          <span class="text-ink">{{ n.text }}</span>
                          <span class="text-muted">· {{ n.at | appDate: 'datetime' }}</span>
                        </li>
                      }
                    </ul>
                  </details>
                }
              </div>
              <div class="flex shrink-0 flex-wrap gap-2">
                @if (f.bucket !== 'Completed') {
                  <button type="button" class="btn btn-secondary btn-sm" (click)="open('note', f)">
                    <svg lucideIcon="sticky-note" size="14" /> Note
                  </button>
                  <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    (click)="open('reschedule', f)"
                  >
                    <svg lucideIcon="calendar-clock" size="14" /> Reschedule
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    (click)="open('complete', f)"
                  >
                    <svg lucideIcon="check" size="14" /> Complete
                  </button>
                } @else {
                  <app-status-badge
                    status="Completed"
                    [label]="'Completed ' + (f.completedOn | appDate: 'dayMonth')"
                  />
                }
              </div>
            </li>
          } @empty {
            <li>
              <app-empty-state
                [icon]="bucket() === 'Overdue' ? 'circle-check' : 'calendar-days'"
                [title]="
                  bucket() === 'Overdue'
                    ? 'Nothing overdue'
                    : 'No ' + bucket().toLowerCase() + ' follow-ups'
                "
                message="Schedule follow-ups from the Leads or Enquiries tab."
              />
            </li>
          }
        </ul>
      }
    </div>

    <app-follow-up-action-dialog
      [(visible)]="dialogOpen"
      [action]="action()"
      [followUp]="selected()"
      (done)="followUps.reload()"
    />
  `,
})
export class FollowUpsTab {
  private readonly service = inject(AdmissionsService);
  private readonly auth = inject(AuthService);

  protected readonly buckets = BUCKETS;
  protected readonly time = formatTime;
  protected readonly bucket = signal<FollowUpBucket>('Today');
  protected readonly search = signal('');
  protected readonly canToggleScope = computed(() => this.auth.role() !== 'Admin');
  protected readonly scope = signal<Scope>(this.auth.role() === 'Admin' ? 'all' : 'mine');

  protected readonly followUps = rxResource({
    params: () => ({
      assignedTo: this.scope() === 'mine' ? (this.auth.user()?.employeeId ?? null) : null,
    }),
    stream: ({ params }) => this.service.getFollowUps(params),
    defaultValue: [],
  });

  private readonly searched = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.followUps.hasValue() ? this.followUps.value() : [];
    return q ? list.filter((f) => f.name.toLowerCase().includes(q) || f.phone.includes(q)) : list;
  });
  protected readonly counts = computed(() => {
    const c: Record<FollowUpBucket, number> = { Today: 0, Overdue: 0, Upcoming: 0, Completed: 0 };
    this.searched().forEach((f) => c[f.bucket]++);
    return c;
  });
  protected readonly visible = computed(() => {
    const list = this.searched().filter((f) => f.bucket === this.bucket());
    return this.bucket() === 'Completed' ? [...list].reverse() : list;
  });

  protected readonly dialogOpen = signal(false);
  protected readonly action = signal<FollowUpAction>('complete');
  protected readonly selected = signal<FollowUpView | null>(null);

  protected channelIcon(channel: string): string {
    return CHANNEL_ICONS[channel] ?? 'phone';
  }

  protected open(action: FollowUpAction, f: FollowUpView): void {
    this.action.set(action);
    this.selected.set(f);
    this.dialogOpen.set(true);
  }
}
