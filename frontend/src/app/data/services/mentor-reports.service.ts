import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client';
import {
  ISODate,
  MentorReportDraft,
  MentorReportFilters,
  MentorReportView,
  PendingReportSummary,
  SaveMentorReportsDto,
} from '../../domain/models';
import { addDays, startOfWeek, todayIso } from '../../shared/utils/date.util';

/** Weekly mentor reports: `/mentor-reports`, `/mentor-reports/pending`, `/mentor-reports/draft`. */
@Injectable({ providedIn: 'root' })
export class MentorReportsService {
  private readonly api = inject(ApiClient);

  /** The last `count` week starts (Mondays), most recent completed week first. */
  recentWeeks(count = 8): ISODate[] {
    const last = addDays(startOfWeek(todayIso()), -7);
    return Array.from({ length: count }, (_, i) => addDays(last, -7 * i));
  }

  /** The current (in-progress) week start — reports can also be drafted for it. */
  currentWeek(): ISODate {
    return startOfWeek(todayIso());
  }

  getReports(filters: MentorReportFilters = {}): Observable<MentorReportView[]> {
    return this.api.get<MentorReportView[]>('mentor-reports', [], { ...filters });
  }

  /** Batches whose report for the last completed week is incomplete. */
  getPending(mentorId?: string | null): Observable<PendingReportSummary[]> {
    return this.api.get<PendingReportSummary[]>('mentor-reports/pending', [], {
      mentorId,
      weekStart: this.recentWeeks(1)[0],
    });
  }

  getDraft(batchId: string, weekStart: ISODate): Observable<MentorReportDraft[]> {
    return this.api.get<MentorReportDraft[]>('mentor-reports/draft', [], { batchId, weekStart });
  }

  /** Saves the week's reports; resolves to the number of reports saved. */
  saveReports(dto: SaveMentorReportsDto): Observable<number> {
    return this.api.post<number>('mentor-reports', dto);
  }
}
