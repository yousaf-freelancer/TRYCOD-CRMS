import { Pipe, PipeTransform } from '@angular/core';
import {
  formatDate,
  formatDateTime,
  formatDayMonth,
  formatMonth,
  formatTime,
  timeAgo,
} from '../utils/date.util';
import { formatDuration, formatInr, formatInrCompact, formatMinutes } from '../utils/format.util';

/** `125000 | inr` → `₹1,25,000`; `| inr:'compact'` → `₹1.3L` */
@Pipe({ name: 'inr' })
export class InrPipe implements PipeTransform {
  transform(value: number | null | undefined, style: 'full' | 'compact' = 'full'): string {
    return style === 'compact' ? formatInrCompact(value ?? 0) : formatInr(value);
  }
}

export type AppDateFormat =
  'date' | 'datetime' | 'time' | 'month' | 'monthLong' | 'dayMonth' | 'ago';

/** `'2026-09-12' | appDate` → `12 Sep 2026` */
@Pipe({ name: 'appDate' })
export class AppDatePipe implements PipeTransform {
  transform(value: string | null | undefined, format: AppDateFormat = 'date'): string {
    if (!value) return '—';
    switch (format) {
      case 'datetime':
        return formatDateTime(value);
      case 'time':
        return formatTime(value);
      case 'month':
        return formatMonth(value.slice(0, 7));
      case 'monthLong':
        return formatMonth(value.slice(0, 7), true);
      case 'dayMonth':
        return formatDayMonth(value);
      case 'ago':
        return timeAgo(value);
      default:
        return formatDate(value);
    }
  }
}

/** Seconds → `4m 12s`; with `'minutes'` → `8h 15m`. */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(value: number | null | undefined, unit: 'seconds' | 'minutes' = 'seconds'): string {
    return unit === 'minutes' ? formatMinutes(value ?? 0) : formatDuration(value ?? 0);
  }
}
