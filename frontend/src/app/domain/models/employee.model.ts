import { ISODate, Role } from './common.model';
import { Gender } from './student.model';

export type StaffRole = Exclude<Role, 'Student'>;
export type EmployeeStatus = 'Active' | 'Inactive';

export interface Employee {
  id: string;
  name: string;
  role: StaffRole;
  department: string;
  designation: string;
  phone: string;
  email: string;
  gender: Gender;
  dob: ISODate;
  joiningDate: ISODate;
  status: EmployeeStatus;
  address: string;
  bankAccount: string;
  pan: string;
  reportingTo: string | null;
}

export interface Department {
  id: string;
  name: string;
  headId: string;
}

export type EmployeeInput = Omit<Employee, 'id'>;
