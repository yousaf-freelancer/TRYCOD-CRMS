import { Role } from '../../domain/models';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  /** Permission code required to see the item. Omitted = any signed-in user. */
  permission?: string;
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

/**
 * Single source of truth for staff navigation. The sidebar filters items by
 * the user's permission codes; route guards use the same codes in `app.routes.ts`.
 */
export const STAFF_NAV: NavSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', icon: 'layout-dashboard', route: '/dashboard', accent: 'text-indigo-400', permission: 'dashboard.view' },
      {
        label: 'Admissions',
        icon: 'user-plus',
        route: '/admissions', accent: 'text-violet-400',
        permission: 'admissions.view',
      },
      { label: 'Sales Calls', icon: 'phone-call', route: '/calls', accent: 'text-sky-400', permission: 'calls.view' },
    ],
  },
  {
    label: 'Academics',
    items: [
      {
        label: 'Students',
        icon: 'graduation-cap',
        route: '/students', accent: 'text-emerald-400',
        permission: 'students.view',
      },
      {
        label: 'Courses & Batches',
        icon: 'book-open',
        route: '/courses', accent: 'text-amber-400',
        permission: 'courses.view',
        labelFor: { Mentor: 'My Batches' },
      },
      {
        label: 'Attendance',
        icon: 'calendar-check',
        route: '/attendance', accent: 'text-teal-400',
        permission: 'attendance.student.mark',
      },
      {
        label: 'Mentor Reports',
        icon: 'clipboard-list',
        route: '/mentor-reports', accent: 'text-pink-400',
        permission: 'mentor_reports.view',
      },
    ],
  },
  {
    label: 'Finance',
    items: [{ label: 'Fees', icon: 'wallet', route: '/fees', accent: 'text-lime-400', permission: 'fees.view' }],
  },
  {
    label: 'HR',
    items: [
      { label: 'Employees', icon: 'users', route: '/hr/employees', accent: 'text-blue-400', permission: 'hr.view' },
      { label: 'Leave', icon: 'calendar-minus', route: '/hr/leave', accent: 'text-orange-400', permission: 'hr.view' },
      { label: 'Payroll', icon: 'banknote', route: '/hr/payroll', accent: 'text-green-400', permission: 'payroll.manage' },
    ],
  },
  {
    label: 'My Workspace',
    items: [
      { label: 'My Attendance', icon: 'clock', route: '/me/attendance', accent: 'text-cyan-400', permission: 'self.access' },
      { label: 'My Leave', icon: 'plane', route: '/me/leave', accent: 'text-orange-400', permission: 'self.access' },
      { label: 'My Payslips', icon: 'receipt', route: '/me/payslips', accent: 'text-green-400', permission: 'self.access' },
    ],
  },
  {
    label: 'Other',
    items: [
      { label: 'Reports', icon: 'chart-column', route: '/reports', accent: 'text-fuchsia-400', permission: 'reports.view' },
      { label: 'Notifications', icon: 'bell', route: '/notifications', accent: 'text-yellow-400' },
      { label: 'Settings', icon: 'settings', route: '/settings', accent: 'text-neutral-300' },
    ],
  },
];

export const PORTAL_NAV: NavItem[] = [
  { label: 'Home', icon: 'house', route: '/portal', exact: true },
  { label: 'Attendance', icon: 'calendar-check', route: '/portal/attendance' },
  { label: 'Fees', icon: 'wallet', route: '/portal/fees' },
  { label: 'Mentor Reports', icon: 'clipboard-list', route: '/portal/reports' },
  { label: 'Notifications', icon: 'bell', route: '/portal/notifications' },
  { label: 'Profile', icon: 'user', route: '/portal/profile' },
];

/** Staff navigation filtered by permission, with role-specific labels applied. */
export function navFor(can: (permission: string) => boolean, role: Role | null): NavSection[] {
  return STAFF_NAV.map((section) => ({
    label: section.label,
    items: section.items
      .filter((item) => !item.permission || can(item.permission))
      .map((item) => ({ ...item, label: (role && item.labelFor?.[role]) || item.label })),
  })).filter((section) => section.items.length > 0);
}
