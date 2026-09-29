import { Component, input } from '@angular/core';

const LABELS = [
  'Not rated',
  'Needs attention',
  'Below expectations',
  'On track',
  'Good',
  'Excellent',
];

/** 1–5 progress rating as filled dots with a label. */
@Component({
  selector: 'app-rating-dots',
  host: { class: 'inline-flex items-center gap-2' },
  template: `
    <span
      class="flex gap-1"
      role="img"
      [attr.aria-label]="'Progress ' + value() + ' of 5: ' + labels[value()]"
    >
      @for (i of [1, 2, 3, 4, 5]; track i) {
        <span
          class="size-2 rounded-full"
          [class]="i <= value() ? 'bg-neutral-950' : 'bg-neutral-200'"
        ></span>
      }
    </span>
    @if (showLabel()) {
      <span class="text-xs text-muted">{{ labels[value()] }}</span>
    }
  `,
})
export class RatingDots {
  readonly value = input.required<number>();
  readonly showLabel = input(true);
  protected readonly labels = LABELS;
}
