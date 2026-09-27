export type Role = 'Admin' | 'Advisor' | 'Mentor' | 'Sales' | 'Student';

export const STAFF_ROLES: readonly Role[] = ['Admin', 'Advisor', 'Mentor', 'Sales'];
export const ALL_ROLES: readonly Role[] = ['Admin', 'Advisor', 'Mentor', 'Sales', 'Student'];

/** Calendar date in `YYYY-MM-DD` form. */
export type ISODate = string;
/** Date-time in ISO-8601 form. */
export type ISODateTime = string;
/** Month key in `YYYY-MM` form. */
export type MonthKey = string;

export interface Option<T = string> {
  label: string;
  value: T;
}
