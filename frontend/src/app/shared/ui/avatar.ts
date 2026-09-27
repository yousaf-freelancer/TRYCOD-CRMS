import { Component, computed, input } from '@angular/core';
import { initials } from '../utils/format.util';

const SHADES = [
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-neutral-900 text-white',
];

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-[11px]',
  md: 'size-10 text-[13px]',
  lg: 'size-14 text-base',
  xl: 'size-20 text-xl',
} as const;

/** Initials avatar; colour is stable per name. */
@Component({
  selector: 'app-avatar',
  host: { class: 'inline-flex shrink-0' },
  template: `
    <span
      class="grid place-items-center rounded-full font-semibold tracking-wide select-none"
      [class]="classes()"
      [attr.aria-label]="name()"
      role="img"
      >{{ letters() }}</span
    >
  `,
})
export class Avatar {
  readonly name = input.required<string>();
  readonly size = input<keyof typeof SIZES>('sm');

  protected readonly letters = computed(() => initials(this.name()));
  protected readonly classes = computed(() => {
    const hash = [...this.name()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    return `${SIZES[this.size()]} ${SHADES[hash % SHADES.length]}`;
  });
}
