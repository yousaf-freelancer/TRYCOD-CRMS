import { Role } from './common.model';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  /** Set for staff users. */
  employeeId?: string;
  /** Set for the student portal user. */
  studentId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember: boolean;
}

export interface DemoAccount {
  role: Role;
  email: string;
  password: string;
}
