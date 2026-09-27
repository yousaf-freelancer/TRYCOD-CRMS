import { Role } from './common.model';

export interface InstituteProfile {
  name: string;
  legalName: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
}

export interface Holiday {
  date: string;
  name: string;
}

export interface AcademicYear {
  label: string;
  startDate: string;
  endDate: string;
  weeklyOff: string;
  holidays: Holiday[];
}

export interface FeeSettings {
  allowInstallments: boolean;
  maxInstallments: number;
  minDownPaymentPct: number;
  installmentGapDays: number;
  lateFeeType: 'Flat' | 'Percent';
  lateFeeValue: number;
  graceDays: number;
  receiptPrefix: string;
  reminderDaysBefore: number;
}

export interface AttendanceRules {
  officeStart: string;
  officeEnd: string;
  staffLateAfterMin: number;
  halfDayBelowHours: number;
  fullDayHours: number;
  studentLateAfterMin: number;
  lowAttendanceAlertPct: number;
  autoMarkAbsentAfter: string;
}

export type PermissionLevel = 'Full' | 'View' | 'None';

export interface PermissionRow {
  module: string;
  levels: Record<Role, PermissionLevel>;
}

export interface NotificationPreference {
  event: string;
  description: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

export interface AppSettings {
  institute: InstituteProfile;
  academicYear: AcademicYear;
  fees: FeeSettings;
  attendance: AttendanceRules;
  permissions: PermissionRow[];
  notificationPrefs: NotificationPreference[];
}
