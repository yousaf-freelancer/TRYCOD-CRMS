import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import { addDays, dateToIso, parseIsoDate, todayIso } from '../../../shared/utils/date.util';

/** Date range picker with quick presets. */
@Component({
  selector: 'app-date-range-filter',
  imports: [FormsModule, DatePickerModule, SelectButtonModule],
  host: { class: 'flex flex-wrap items-center gap-2' },
  template: `
    <p-selectbutton
      [options]="presets"
      optionLabel="label"
      optionValue="days"
      [ngModel]="null"
      (ngModelChange)="preset($event)"
      size="small"
      ariaLabelledBy="range-presets"
    />
    <span id="range-presets" class="sr-only">Quick ranges</span>
    <p-datepicker
      [(ngModel)]="range"
      selectionMode="range"
      [readonlyInput]="true"
      dateFormat="dd M yy"
      placeholder="Custom range"
      [showIcon]="true"
      iconDisplay="input"
      [maxDate]="today"
      class="!w-60"
      inputId="report-range"
      ariaLabel="Date range"
      appendTo="body"
    />
  `,
})
export class DateRangeFilter {
  readonly range = model<Date[] | null>(null);
  protected readonly today = parseIsoDate(todayIso());
  protected readonly presets = [
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
    { label: '6M', days: 182 },
  ];

  protected preset(days: number | null): void {
    if (!days) return;
    this.range.set([parseIsoDate(addDays(todayIso(), -days + 1)), parseIsoDate(todayIso())]);
  }
}

export function rangeToIso(range: Date[] | null): { from: string | null; to: string | null } {
  const [from, to] = range ?? [];
  return { from: dateToIso(from), to: dateToIso(to ?? from) };
}
