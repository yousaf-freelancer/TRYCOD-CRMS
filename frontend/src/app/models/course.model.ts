import { ISODate } from './common.model';

export type CourseStatus = 'Active' | 'Inactive';

export interface Course {
  id: string;
  code: string;
  name: string;
  category: string;
  durationMonths: number;
  fee: number;
  status: CourseStatus;
  description: string;
}

export type BatchStatus = 'Upcoming' | 'Ongoing' | 'Completed';
export type BatchMode = 'Classroom' | 'Hybrid' | 'Online';

export interface Batch {
  id: string;
  code: string;
  courseId: string;
  mentorId: string;
  timing: string;
  startDate: ISODate;
  endDate: ISODate;
  capacity: number;
  status: BatchStatus;
  mode: BatchMode;
}

/** Batch joined with display fields. */
export interface BatchView extends Batch {
  courseName: string;
  mentorName: string;
  enrolled: number;
}

export type CourseInput = Omit<Course, 'id'>;
export type BatchInput = Omit<Batch, 'id'>;
