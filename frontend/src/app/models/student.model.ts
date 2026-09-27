import { ISODate } from './common.model';
import { FeeStatus } from './fee.model';

export type StudentStatus = 'Active' | 'Completed' | 'Dropped';
export type Gender = 'Male' | 'Female';
export type GuardianRelation = 'Father' | 'Mother' | 'Guardian' | 'Spouse';

export interface Guardian {
  name: string;
  relation: GuardianRelation;
  phone: string;
  occupation: string;
}

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  dob: ISODate;
  phone: string;
  email: string;
  address: string;
  city: string;
  qualification: string;
  guardian: Guardian;
  courseId: string;
  batchId: string;
  admissionDate: ISODate;
  status: StudentStatus;
}

/** Student row as shown in lists (joined + derived fields). */
export interface StudentListItem extends Student {
  courseName: string;
  batchCode: string;
  mentorId: string;
  mentorName: string;
  attendancePct: number;
  feeStatus: FeeStatus;
  balance: number;
}

export interface StudentFilters {
  courseId?: string | null;
  batchId?: string | null;
  mentorId?: string | null;
  status?: StudentStatus | null;
}

export type DocumentType = 'ID Proof' | 'Certificate' | 'Photo' | 'Agreement' | 'Other';

export interface StudentDocument {
  id: string;
  studentId: string;
  name: string;
  type: DocumentType;
  fileName: string;
  sizeKb: number;
  uploadedOn: ISODate;
  verified: boolean;
}

export type StudentInput = Omit<Student, 'id'>;
