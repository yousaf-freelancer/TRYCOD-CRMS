/**
 * Accent tones used for icons, avatars and highlights. Brand chrome stays
 * black & white; tones add colour where it helps people scan.
 */
export type Tone = 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'teal' | 'orange' | 'pink' | 'neutral';

/** Soft tile: tinted background + strong foreground. */
export const TONE_TILE: Record<Tone, string> = {
  indigo: 'bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100',
  rose: 'bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100',
  sky: 'bg-sky-50 text-sky-600 ring-1 ring-inset ring-sky-100',
  violet: 'bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-100',
  teal: 'bg-teal-50 text-teal-600 ring-1 ring-inset ring-teal-100',
  orange: 'bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-100',
  pink: 'bg-pink-50 text-pink-600 ring-1 ring-inset ring-pink-100',
  neutral: 'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200',
};

/** Thin accent bar colour (e.g. top edge of a card). */
export const TONE_BAR: Record<Tone, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  teal: 'bg-teal-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  neutral: 'bg-neutral-400',
};

const ICON_TONES: Record<string, Tone> = {
  'graduation-cap': 'emerald',
  'calendar-check': 'teal',
  'calendar-clock': 'amber',
  users: 'sky',
  wallet: 'indigo',
  'indian-rupee': 'emerald',
  banknote: 'emerald',
  hourglass: 'amber',
  'triangle-alert': 'rose',
  'user-check': 'violet',
  'user-plus': 'violet',
  'messages-square': 'violet',
  phone: 'sky',
  'phone-incoming': 'emerald',
  'phone-missed': 'rose',
  'phone-forwarded': 'indigo',
  plane: 'orange',
  'circle-check': 'emerald',
  'circle-x': 'rose',
  'circle-minus': 'rose',
  'clipboard-list': 'pink',
  layers: 'amber',
  'chart-line': 'indigo',
};

const ROTATION: Tone[] = ['indigo', 'emerald', 'amber', 'sky', 'violet', 'rose', 'teal', 'orange', 'pink'];

export function hashTone(key: string): Tone {
  const hash = [...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return ROTATION[hash % ROTATION.length];
}

export function toneForIcon(icon: string, fallbackKey = icon): Tone {
  return ICON_TONES[icon] ?? hashTone(fallbackKey);
}
