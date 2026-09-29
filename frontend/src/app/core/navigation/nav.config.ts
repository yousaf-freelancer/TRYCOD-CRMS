import { Role, STAFF_ROLES } from '../../domain/models';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: readonly Role[];
  /** Match the route exactly when computing the active state. */
  exact?: boolean;
  /** Icon accent colour (Tailwind text class) used in the dark sidebar. */
  accent?: string;
  /** Optional per-role label override (e.g. "My Batches" for mentors). */
  labelFor?: Partial<Record<Role, string>>;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

const ADMIN: readonly Role[] = ['Admin'];

/**
 * Single source of truth for staff navigation. The sidebar filters items by
 * the current role; route guards use the same role lists in `app.routes.ts`.
 */
export const STAFF_NAV: NavSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', icon: 'layout-dashboard', route: '/dashboard', accent: 'text-indigo-400', roles: STAFF_ROLES },
      {
        label: 'Admissions',
        icon: 'user-plus',
        route: '/admissions', accent: 'text-violet-400',
        roles: ['Admin', 'Advisor', 'Sales'],
      },
      { label: 'Sales Calls', icon: 'phone-call', route: '/calls', accent: 'text-sky-400', roles: ['Admin', 'Sales'] },
    ],
  },
  {
    label: 'Academics',
    items: [
      {
        label: 'Students',
        icon: 'graduation-cap',
        route: '/students', accent: 'text-emerald-400',
        roles: ['Admin', 'Advisor', 'Mentor'],
      },
      {
        label: 'Courses & Batches',
        icon: 'book-open',
        route: '/courses', accent: 'text-amber-400',
        roles: ['Admin', 'Advisor', 'Mentor'],
        labelFor: { Mentor: 'My Batches' },
      },
      {
        label: 'Attendance',
        icon: 'calendar-check',
        route: '/attendance', accent: 'text-teal-400',
        roles: ['Admin', 'Mentor'],
      },
      {
        label: 'Mentor Reports',
        icon: 'clipboard-list',
        route: '/mentor-reports', accent: 'text-pink-400',
        roles: ['Admin', 'Mentor'],
      },
    ],
  },
  {
    label: 'Finance',
    items: [{ label: 'Fees', icon: 'wallet', route: '/fees', accent: 'text-lime-400', roles: ['Admin', 'Advisor'] }],
  },
  {
    label: 'HR',
    items: [
      { label: 'Employees', icon: 'users', route: '/hr/employees', accent: 'text-blue-400', roles: ADMIN },
      { label: 'Leave', icon: 'calendar-minus', route: '/hr/leave', accent: 'text-orange-400', roles: ADMIN },
      { label: 'Payroll', icon: 'banknote', route: '/hr/payroll', accent: 'text-green-400', roles: ADMIN },
    ],
  },
  {
    label: 'My Workspace',
    items: [
      { label: 'My Attendance', icon: 'clock', route: '/me/attendance', accent: 'text-cyan-400', roles: STAFF_ROLES },
      { label: 'My Leave', icon: 'plane', route: '/me/leave', accent: 'text-orange-400', roles: STAFF_ROLES },
      { label: 'My Payslips', icon: 'receipt', route: '/me/payslips', accent: 'text-green-400', roles: STAFF_ROLES },
    ],
  },
  {
    label: 'Other',
    items: [
      { label: 'Reports', icon: 'chart-column', route: '/reports', accent: 'text-fuchsia-400', roles: ADMIN },
      { label: 'Notifications', icon: 'bell', route: '/notifications', accent: 'text-yellow-400', roles: STAFF_ROLES },
      { label: 'Settings', icon: 'settings', route: '/settings', accent: 'text-neutral-300', roles: STAFF_ROLES },
    ],
  },
];

export const PORTAL_NAV: NavItem[] = [
  { label: 'Home', icon: 'house', route: '/portal', roles: ['Student'], exact: true },
  { label: 'Attendance', icon: 'calendar-check', route: '/portal/attendance', roles: ['Student'] },
  { label: 'Fees', icon: 'wallet', route: '/portal/fees', roles: ['Student'] },
  { label: 'Mentor Reports', icon: 'clipboard-list', route: '/portal/reports', roles: ['Student'] },
  { label: 'Notifications', icon: 'bell', route: '/portal/notifications', roles: ['Student'] },
  { label: 'Profile', icon: 'user', route: '/portal/profile', roles: ['Student'] },
];

export function navForRole(role: Role | null): NavSection[] {
  if (!role) return [];
  return STAFF_NAV.map((section) => ({
    label: section.label,
    items: section.items
      .filter((item) => item.roles.includes(role))
      .map((item) => ({ ...item, label: item.labelFor?.[role] ?? item.label })),
  })).filter((section) => section.items.length > 0);
}

/** Role lists reused by route definitions so guards and nav never drift apart. */
export const ROUTE_ROLES = {
  admissions: ['Admin', 'Advisor', 'Sales'],
  admissionsOnly: ['Admin', 'Advisor'],
  calls: ['Admin', 'Sales'],
  students: ['Admin', 'Advisor', 'Mentor'],
  courses: ['Admin', 'Advisor', 'Mentor'],
  attendance: ['Admin', 'Mentor'],
  mentorReports: ['Admin', 'Mentor'],
  fees: ['Admin', 'Advisor'],
  admin: ['Admin'],
  staff: STAFF_ROLES,
  student: ['Student'],
} as const satisfies Record<string, readonly Role[]>;
