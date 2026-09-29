import { ISODateTime, Role } from './common.model';

export type NotificationType =
  | 'fee_due'
  | 'fee_received'
  | 'follow_up_due'
  | 'follow_up_overdue'
  | 'new_admission'
  | 'leave_request'
  | 'attendance_alert'
  | 'system';

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  fee_due: 'Fee due',
  fee_received: 'Fee received',
  follow_up_due: 'Follow-up due',
  follow_up_overdue: 'Follow-up overdue',
  new_admission: 'New admission',
  leave_request: 'Leave request',
  attendance_alert: 'Attendance alert',
  system: 'System',
};

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  at: ISODateTime;
  read: boolean;
  /** Roles that see this notification. */
  audience: Role[];
  /** Optional in-app route to open. */
  link: string | null;
}
