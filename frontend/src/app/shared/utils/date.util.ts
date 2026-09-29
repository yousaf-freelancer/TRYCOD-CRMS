import { ISODate, MonthKey } from '../../domain/models';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as `YYYY-MM-DD` (never UTC-shifted). */
export function toIsoDate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayIso(): ISODate {
  return toIsoDate(new Date());
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function addMonths(iso: ISODate, months: number): ISODate {
  const d = parseIsoDate(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const max = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, max));
  return toIsoDate(d);
}

/** Whole days from `b` to `a` (a - b). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((parseIsoDate(a).getTime() - parseIsoDate(b).getTime()) / 86_400_000);
}

export function isSunday(iso: ISODate): boolean {
  return parseIsoDate(iso).getDay() === 0;
}

export function weekdayShort(iso: ISODate): string {
  return WEEKDAYS[parseIsoDate(iso).getDay()];
}

export function monthKeyOf(iso: ISODate): MonthKey {
  return iso.slice(0, 7);
}

export function currentMonthKey(): MonthKey {
  return monthKeyOf(todayIso());
}

export function addMonthKey(key: MonthKey, delta: number): MonthKey {
  return monthKeyOf(addMonths(`${key}-01`, delta));
}

export function daysInMonth(key: MonthKey): number {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function monthDates(key: MonthKey): ISODate[] {
  return Array.from({ length: daysInMonth(key) }, (_, i) => `${key}-${pad(i + 1)}`);
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso: ISODate): ISODate {
  const d = parseIsoDate(iso);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return toIsoDate(d);
}

/** Month keys, oldest first, ending with the current month. */
export function lastMonthKeys(count: number): MonthKey[] {
  const now = currentMonthKey();
  return Array.from({ length: count }, (_, i) => addMonthKey(now, i - count + 1));
}

export function inRange(iso: ISODate, from?: ISODate | null, to?: ISODate | null): boolean {
  const d = iso.slice(0, 10);
  return (!from || d >= from) && (!to || d <= to);
}

/** `12 Sep 2026` */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = parseIsoDate(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** `12 Sep` */
export function formatDayMonth(iso: string): string {
  const d = parseIsoDate(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;
}

/** `09:30 AM` from `HH:mm` or an ISO date-time. */
export function formatTime(value: string | null | undefined): string {
  if (!value) return '—';
  const hm = value.includes('T') ? value.slice(11, 16) : value.slice(0, 5);
  const [h, m] = hm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(h12)}:${pad(m)} ${suffix}`;
}

/** `12 Sep 2026, 09:30 AM` */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

/** `Sep 2026` / `September 2026` */
export function formatMonth(key: MonthKey, long = false): string {
  const [y, m] = key.split('-').map(Number);
  return `${(long ? MONTHS_LONG : MONTHS)[m - 1]} ${y}`;
}

export function monthShortName(key: MonthKey): string {
  return MONTHS[Number(key.split('-')[1]) - 1];
}

/** Human "3h ago" style label relative to now. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

/** Local ISO date-time (`YYYY-MM-DDTHH:mm:00`) for a date plus minutes since midnight. */
export function atMinutes(iso: ISODate, minutes: number): string {
  return `${iso}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00`;
}

export function minutesOf(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

export function hmFromMinutes(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function dateToIso(value: Date | null | undefined): ISODate | null {
  return value ? toIsoDate(value) : null;
}

export function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** `Sunday, 27 September 2026` */
export function longToday(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Today, or Saturday when today is the weekly off (Sunday). */
export function lastWorkingDay(): ISODate {
  const today = todayIso();
  return isSunday(today) ? addDays(today, -1) : today;
}

/** `Today` or e.g. `Sat, 26 Sep` for a reference day. */
export function dayLabel(iso: ISODate): string {
  return iso === todayIso() ? 'Today' : `${weekdayShort(iso)}, ${formatDayMonth(iso)}`;
}

/** `today` or `Sat, 26 Sep` — for use mid-sentence. */
export function dayPhrase(iso: ISODate): string {
  return iso === todayIso() ? 'today' : dayLabel(iso);
}
