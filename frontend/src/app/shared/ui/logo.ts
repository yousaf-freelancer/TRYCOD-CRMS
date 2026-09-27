import { Component, input, signal } from '@angular/core';

/**
 * Trycod logo from `public/images/trycod-logo.png`, always rendered at its
 * natural aspect ratio (height-driven, `width: auto`, `object-fit: contain`).
 * If the file is missing, a typographic wordmark is shown instead.
 */
@Component({
  selector: 'app-logo',
  host: { class: 'inline-flex items-center' },
  template: `
    @if (!failed()) {
      <img
        src="images/trycod-logo.png"
        alt="Trycod Tech School"
        [style.height.px]="height()"
        class="block w-auto max-w-none object-contain select-none"
        draggable="false"
        (error)="failed.set(true)"
      />
    } @else {
      <span
        class="inline-flex items-center gap-2 font-semibold tracking-tight"
        [class.text-white]="onDark()"
        [class.text-ink]="!onDark()"
        [style.font-size.px]="height() * 0.62"
        role="img"
        aria-label="Trycod Tech School"
      >
        <span
          class="grid place-items-center rounded-md font-mono text-[0.7em] font-bold"
          [class]="onDark() ? 'bg-white text-neutral-950' : 'bg-neutral-950 text-white'"
          [style.width.px]="height()"
          [style.height.px]="height()"
          >&lt;/&gt;</span
        >
        trycod
      </span>
    }
  `,
})
export class Logo {
  readonly height = input(28);
  /** Only affects the text fallback — the image itself is never recoloured. */
  readonly onDark = input(false);
  protected readonly failed = signal(false);
}
