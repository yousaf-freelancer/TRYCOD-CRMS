import { Component, input } from '@angular/core';
import { MentorReportView } from '../../../../domain/models';
import { AppDatePipe } from '../../../../shared/pipes/format.pipes';
import { addDays } from '../../../../shared/utils/date.util';
import { RatingDots } from './rating-dots';

/** Weekly mentor reports as a vertical timeline. */
@Component({
  selector: 'app-report-timeline',
  imports: [AppDatePipe, RatingDots],
  host: { class: 'block' },
  template: `
    <ol class="relative space-y-4 border-l border-line pl-6">
      @for (r of reports(); track r.id) {
        <li class="relative">
          <span
            class="absolute top-4 -left-[29px] size-2.5 rounded-full border-2 border-white bg-neutral-950 ring-1 ring-neutral-300"
            aria-hidden="true"
          ></span>
          <article class="card card-pad">
            <header class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="text-sm font-semibold">
                  Week of {{ r.weekStart | appDate: 'dayMonth' }} –
                  {{ weekEnd(r.weekStart) | appDate }}
                </p>
                <p class="text-xs text-muted">
                  {{ r.mentorName }} · {{ r.batchCode }} · submitted
                  {{ r.submittedAt | appDate: 'datetime' }}
                </p>
              </div>
              <app-rating-dots [value]="r.progressRating" />
            </header>
            <dl class="mt-4 grid gap-4 text-[13px] sm:grid-cols-2">
              <div>
                <dt class="text-xs font-medium text-muted">Strengths</dt>
                <dd class="mt-0.5">{{ r.strengths || '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium text-muted">Areas to improve</dt>
                <dd class="mt-0.5">{{ r.improvements || '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium text-muted">Attendance</dt>
                <dd class="mt-0.5">{{ r.attendanceRemark || '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium text-muted">Mentor remarks</dt>
                <dd class="mt-0.5">{{ r.remarks || '—' }}</dd>
              </div>
            </dl>
          </article>
        </li>
      }
    </ol>
  `,
})
export class ReportTimeline {
  readonly reports = input.required<MentorReportView[]>();
  protected weekEnd(start: string): string {
    return addDays(start, 5);
  }
}
