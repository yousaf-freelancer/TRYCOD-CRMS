import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';
import { AuthService } from '../../../core/auth/auth.service';
import { MentorReportDraft } from '../../../domain/models';
import { addDays, formatDate } from '../../../shared/utils/date.util';
import { Avatar } from '../../../shared/ui/avatar';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { ToastService } from '../../../shared/ui/toast.service';
import { ongoingBatchOptions } from '../attendance/ui/batch-options';
import { MentorReportsService } from '../../../data/services/mentor-reports.service';

const RATINGS = [
  { value: 1, label: 'Needs attention' },
  { value: 2, label: 'Below expectations' },
  { value: 3, label: 'On track' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Excellent' },
];
const ATTENDANCE_REMARKS = [
  'Regular',
  'Late twice this week',
  'Missed one session',
  'Missed multiple sessions',
  'Irregular — follow up',
];

@Component({
  selector: 'app-write-reports-page',
  imports: [
    FormsModule,
    RouterLink,
    LucideDynamicIcon,
    SelectModule,
    TextareaModule,
    SkeletonModule,
    Avatar,
    EmptyState,
    PageHeader,
  ],
  host: { class: 'block page-enter' },
  template: `
    <a
      routerLink="/mentor-reports"
      class="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink"
      ><svg lucideIcon="arrow-left" size="14" /> Mentor reports</a
    >
    <app-page-header
      title="Write weekly reports"
      subtitle="Rate progress and leave short, specific notes for each student."
    />

    <div class="card card-pad mb-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px_auto] md:items-end">
      <div class="field">
        <label class="field-label" for="wr-batch">Batch</label>
        <p-select
          inputId="wr-batch"
          [options]="batchOptions.options()"
          optionLabel="label"
          optionValue="value"
          [(ngModel)]="batchId"
          placeholder="Select batch"
        />
      </div>
      <div class="field">
        <label class="field-label" for="wr-week">Week</label>
        <p-select
          inputId="wr-week"
          [options]="weeks"
          optionLabel="label"
          optionValue="value"
          [(ngModel)]="week"
        />
      </div>
      <div class="text-[13px]">
        <p class="text-muted">Completed</p>
        <p class="font-semibold tabular-nums">{{ done() }} / {{ drafts().length }}</p>
      </div>
    </div>

    @if (!batchId()) {
      <div class="card">
        <app-empty-state
          icon="clipboard-pen"
          title="Pick a batch"
          message="Choose one of your batches to start writing reports."
        />
      </div>
    } @else if (draft.isLoading()) {
      <div class="space-y-3">
        @for (i of [1, 2, 3]; track i) {
          <div class="card card-pad"><p-skeleton height="7rem" /></div>
        }
      </div>
    } @else {
      <div class="space-y-3">
        @for (d of drafts(); track d.studentId; let i = $index) {
          <article class="card card-pad" [class.!border-neutral-950]="d.progressRating > 0">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div class="flex items-center gap-3 lg:w-56 lg:shrink-0">
                <app-avatar [name]="d.studentName" size="md" />
                <div>
                  <p class="font-medium">{{ d.studentName }}</p>
                  <p class="text-xs text-muted">
                    Attendance this week: {{ d.attendancePct || '—'
                    }}{{ d.attendancePct ? '%' : '' }}
                  </p>
                  @if (d.existingId) {
                    <p class="mt-0.5 text-xs text-[var(--tc-success-fg)]">Submitted · editing</p>
                  }
                </div>
              </div>
              <div class="grid flex-1 gap-3 md:grid-cols-2">
                <div class="field md:col-span-2">
                  <span class="field-label" [id]="'rate-' + i">Progress</span>
                  <div
                    class="flex flex-wrap gap-1.5"
                    role="radiogroup"
                    [attr.aria-labelledby]="'rate-' + i"
                  >
                    @for (r of ratings; track r.value) {
                      <button
                        type="button"
                        role="radio"
                        [attr.aria-checked]="d.progressRating === r.value"
                        class="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors"
                        [class]="
                          d.progressRating === r.value
                            ? 'border-neutral-950 bg-neutral-950 text-white'
                            : 'border-line bg-white text-ink-secondary hover:border-neutral-400'
                        "
                        (click)="update(i, { progressRating: r.value })"
                      >
                        {{ r.value }} · {{ r.label }}
                      </button>
                    }
                  </div>
                </div>
                <div class="field">
                  <label class="field-label" [for]="'att-' + i">Attendance remark</label>
                  <p-select
                    [inputId]="'att-' + i"
                    [options]="attendanceRemarks"
                    [ngModel]="d.attendanceRemark"
                    (ngModelChange)="update(i, { attendanceRemark: $event })"
                    placeholder="Select"
                    [editable]="true"
                    appendTo="body"
                  />
                </div>
                <div class="field">
                  <label class="field-label" [for]="'str-' + i">Strengths</label>
                  <textarea
                    pTextarea
                    [id]="'str-' + i"
                    rows="2"
                    [ngModel]="d.strengths"
                    (ngModelChange)="update(i, { strengths: $event })"
                    placeholder="What went well"
                  ></textarea>
                </div>
                <div class="field">
                  <label class="field-label" [for]="'imp-' + i">Improvements</label>
                  <textarea
                    pTextarea
                    [id]="'imp-' + i"
                    rows="2"
                    [ngModel]="d.improvements"
                    (ngModelChange)="update(i, { improvements: $event })"
                    placeholder="What to work on next week"
                  ></textarea>
                </div>
                <div class="field">
                  <label class="field-label" [for]="'rem-' + i">Remarks</label>
                  <textarea
                    pTextarea
                    [id]="'rem-' + i"
                    rows="2"
                    [ngModel]="d.remarks"
                    (ngModelChange)="update(i, { remarks: $event })"
                    placeholder="Optional"
                  ></textarea>
                </div>
              </div>
            </div>
          </article>
        } @empty {
          <div class="card">
            <app-empty-state icon="users" title="No active students in this batch" />
          </div>
        }
      </div>

      @if (drafts().length) {
        <div
          class="sticky bottom-4 z-10 mt-4 flex flex-col gap-3 rounded-card border border-line bg-white/95 p-3 shadow-pop backdrop-blur sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="px-2 text-[13px] text-muted">
            Only students with a progress rating are saved.
            {{ drafts().length - done() }} remaining.
          </p>
          <button
            type="button"
            class="btn btn-primary"
            (click)="save()"
            [disabled]="saving() || !done()"
          >
            <svg lucideIcon="send" size="15" />
            {{ saving() ? 'Submitting…' : 'Submit ' + done() + ' reports' }}
          </button>
        </div>
      }
    }
  `,
})
export class WriteReportsPage {
  private readonly service = inject(MentorReportsService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly batch = input<string>();
  readonly weekParam = input<string>(undefined, { alias: 'week' });

  protected readonly ratings = RATINGS;
  protected readonly attendanceRemarks = ATTENDANCE_REMARKS;
  protected readonly batchOptions = ongoingBatchOptions();
  protected readonly weeks = [this.service.currentWeek(), ...this.service.recentWeeks(6)].map(
    (w, i) => ({
      label: `${i === 0 ? 'This week' : i === 1 ? 'Last week' : 'Week'} · ${formatDate(w)} – ${formatDate(addDays(w, 5))}`,
      value: w,
    }),
  );

  protected readonly batchId = signal<string | null>(null);
  protected readonly week = signal<string>(this.service.recentWeeks(1)[0]);
  protected readonly drafts = signal<MentorReportDraft[]>([]);
  protected readonly saving = signal(false);
  protected readonly done = computed(
    () => this.drafts().filter((d) => d.progressRating > 0).length,
  );

  protected readonly draft = rxResource({
    params: () => (this.batchId() ? { batchId: this.batchId()!, week: this.week() } : undefined),
    stream: ({ params }) => this.service.getDraft(params.batchId, params.week),
  });

  constructor() {
    effect(() => {
      const b = this.batch();
      if (b) this.batchId.set(b);
      const w = this.weekParam();
      if (w) this.week.set(w);
    });
    effect(() => {
      const opts = this.batchOptions.options();
      if (!this.batchId() && !this.batch() && opts.length) this.batchId.set(opts[0].value);
    });
    effect(() => this.drafts.set(this.draft.hasValue() ? (this.draft.value() ?? []) : []));
  }

  protected update(index: number, changes: Partial<MentorReportDraft>): void {
    this.drafts.update((list) => list.map((d, i) => (i === index ? { ...d, ...changes } : d)));
  }

  protected save(): void {
    const batchId = this.batchId();
    const batch = this.batchOptions.batches.value().find((b) => b.id === batchId);
    if (!batchId || !batch) return;
    this.saving.set(true);
    this.service
      .saveReports({
        batchId,
        mentorId:
          this.auth.role() === 'Mentor'
            ? (this.auth.user()?.employeeId ?? batch.mentorId)
            : batch.mentorId,
        weekStart: this.week(),
        reports: this.drafts(),
      })
      .subscribe((n) => {
        this.saving.set(false);
        this.toast.success('Reports submitted', `${n} student reports for ${batch.code}.`);
        this.draft.reload();
      });
  }
}
